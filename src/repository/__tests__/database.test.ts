import { describe, it, expect, beforeEach, afterEach } from "vitest";
import initSqlJs, { type Database } from "sql.js";

describe("SQLite database via sql.js", () => {
  let db: Database;

  beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
  });

  afterEach(() => {
    db.close();
  });

  it("creates a table", () => {
    db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");

    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='test'"
    );

    expect(tables).toHaveLength(1);
    expect(tables[0].values[0][0]).toBe("test");
  });

  it("writes and reads a row", () => {
    db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
    db.run("INSERT INTO test (id, name) VALUES (1, 'hello')");

    const result = db.exec("SELECT id, name FROM test");

    expect(result).toHaveLength(1);
    expect(result[0].columns).toEqual(["id", "name"]);
    expect(result[0].values).toEqual([[1, "hello"]]);
  });

  it("writes and reads multiple rows", () => {
    db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
    db.run("INSERT INTO test (id, name) VALUES (1, 'first')");
    db.run("INSERT INTO test (id, name) VALUES (2, 'second')");
    db.run("INSERT INTO test (id, name) VALUES (3, 'third')");

    const result = db.exec("SELECT id, name FROM test ORDER BY id");

    expect(result[0].values).toEqual([
      [1, "first"],
      [2, "second"],
      [3, "third"],
    ]);
  });
});
