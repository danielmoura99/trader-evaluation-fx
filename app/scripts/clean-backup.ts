// scripts/clean-backup.ts
import * as fs from "fs";

const inputFile = "backup.sql";
const outputFile = "cleaned-backup.sql";

const content = fs.readFileSync(inputFile, "utf-8");

// Remove comandos específicos que podem causar problemas
const cleaned = content
  .replace(/^CREATE EXTENSION.*;$/gm, "") // Remove extensões
  .replace(/^SET .*;$/gm, "") // Remove configurações específicas
  .replace(/^ALTER SYSTEM .*;$/gm, "") // Remove alterações do sistema
  .replace(/^SELECT pg_catalog.*;$/gm, ""); // Remove comandos do catálogo

fs.writeFileSync(outputFile, cleaned);

console.log("Backup limpo criado com sucesso!");
