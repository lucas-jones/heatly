import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { open as openDuckDB } from "@evan/duckdb";
import { latLngToCell } from "h3-js";

type H3Index = string;
type TotalWh = number;
type History = { [index: H3Index]: TotalWh };
type JsonData = { [time: string]: History };

function printUsageAndExit(message?: string): never {
	if (message) console.error(message);
	console.error(
		"Usage: bun run generate.ts <YYYY-MM-DD> [--parquet /abs/path/data.parquet] [--metadata /abs/path/metadata.csv] [--out /abs/path/out.json] [--pretty]",
	);
	process.exit(1);
}

function parseArgs(argv: string[]) {
	const args = argv.slice(2);
	if (args.length === 0) printUsageAndExit("Missing date argument");

	const dateArg = args[0];
	const options: Record<string, string | boolean> = {};

	for (let i = 1; i < args.length; i++) {
		const a = args[i];
		if (a === "--pretty") {
			options.pretty = true;
			continue;
		}
		if (a.startsWith("--")) {
			const key = a.slice(2);
			const value = args[i + 1];
			if (!value || value.startsWith("--")) printUsageAndExit(`Missing value for --${key}`);
			options[key] = value;
			i++;
			continue;
		}
	}

	return { dateArg, options } as {
		dateArg: string;
		options: { parquet?: string; metadata?: string; out?: string; pretty?: boolean };
	};
}

function parseUTCDate(dateStr: string): { start: Date; end: Date } {
	// Expect YYYY-MM-DD
	const m = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
	if (!m) printUsageAndExit("Date must be in format YYYY-MM-DD");

	const [y, mo, d] = dateStr.split("-").map((v) => Number(v));
	const start = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
	const end = new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0, 0));
	return { start, end };
}

async function queryDayRows(parquetPath: string, metadataPath: string, start: Date, end: Date) {
	const db = openDuckDB(":memory:");
	const connection = db.connect();

	// Create views over files
	connection.query(`CREATE VIEW data AS SELECT * FROM read_parquet('${parquetPath.replaceAll("'", "''")}');`);
	connection.query(
		`CREATE VIEW metadata AS SELECT ss_id, latitude_rounded AS lat, longitude_rounded AS lon FROM read_csv_auto('${metadataPath.replaceAll("'", "''")}');`,
	);

	const startISO = start.toISOString();
	const endISO = end.toISOString();

	const sql = `
		SELECT d.ss_id, d.datetime_GMT, d.generation_Wh, m.lat, m.lon
		FROM data d
		JOIN metadata m USING (ss_id)
		WHERE d.datetime_GMT >= TIMESTAMP '${startISO}' AND d.datetime_GMT < TIMESTAMP '${endISO}'
		ORDER BY d.datetime_GMT, d.ss_id
	`;

	const rows = connection.query<{ ss_id: number; datetime_GMT: Date | string; generation_Wh: number; lat: number; lon: number }>(sql);
	connection.close();
	db.close();
	return rows;
}

function buildAggregatedJson(rows: Array<{ datetime_GMT: Date | string; generation_Wh: number; lat: number; lon: number }>): JsonData {
	const result: JsonData = {};
	for (const row of rows) {
		const ts = row.datetime_GMT instanceof Date ? row.datetime_GMT : new Date(row.datetime_GMT);
		const timeKey = ts.toISOString();
		const h3 = latLngToCell(row.lat, row.lon, 5);
		const historyForTime = (result[timeKey] ||= {});
		const current = historyForTime[h3] ?? 0;
		historyForTime[h3] = current + (Number(row.generation_Wh) || 0);
	}

	// Keep only positive totals and drop empty time buckets
	for (const timeKey of Object.keys(result)) {
		const history = result[timeKey]!;
		for (const h3 of Object.keys(history)) {
			if (!(history[h3] > 0)) {
				delete history[h3];
			}
		}
		if (Object.keys(history).length === 0) {
			delete result[timeKey];
		}
	}

	return result;
}

async function main() {
	const { dateArg, options } = parseArgs(process.argv);
	const { start, end } = parseUTCDate(dateArg);

	const projectRoot = resolve(process.cwd());
	const parquetPath = options.parquet ? resolve(String(options.parquet)) : resolve(projectRoot, "public", "data.parquet");
	const metadataPath = options.metadata ? resolve(String(options.metadata)) : resolve(projectRoot, "public", "metadata.csv");

	if (!existsSync(parquetPath)) printUsageAndExit(`Parquet not found at ${parquetPath}`);
	if (!existsSync(metadataPath)) printUsageAndExit(`Metadata not found at ${metadataPath}`);

	const rows = await queryDayRows(parquetPath, metadataPath, start, end);
	const json = buildAggregatedJson(rows);

	const output = options.pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
	if (options.out) {
		const outPath = resolve(String(options.out));
		await writeFile(outPath, output, "utf8");
		console.log(`Wrote ${Object.keys(json).length} H3 buckets to ${outPath}`);
	} else {
		console.log(output);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
