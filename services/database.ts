import { AppState } from '../types';

// Declara o initSqlJs que será carregado do script no HTML
declare const initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<any>;

let db: any = null;

const DB_KEY = 'agendaLinkState';

// Inicializa o banco de dados. Será chamado uma vez no App.tsx.
export const initDatabase = async () => {
  if (db) return; // Já inicializado
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    db = new SQL.Database();
    // Cria a tabela se ela não existir. Usamos uma tabela chave-valor simples
    // para imitar o localStorage e minimizar as mudanças na arquitetura.
    db.run(`
      CREATE TABLE IF NOT EXISTS app_storage (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
  }
};

// Salva o estado completo da aplicação no banco de dados.
export const saveStateToDB = (state: AppState) => {
  if (!db) return;
  try {
    const stateString = JSON.stringify(state);
    db.run("INSERT OR REPLACE INTO app_storage (key, value) VALUES (?, ?)", [DB_KEY, stateString]);
  } catch (error) {
    console.error("Erro ao salvar o estado no banco de dados:", error);
  }
};

// Carrega o estado da aplicação do banco de dados.
export const loadStateFromDB = (): AppState | null => {
  if (!db) return null;
  try {
    const res = db.exec(`SELECT value FROM app_storage WHERE key = '${DB_KEY}'`);
    if (res.length > 0 && res[0].values.length > 0) {
      return JSON.parse(res[0].values[0][0]);
    }
    return null;
  } catch (error) {
    console.error("Erro ao carregar o estado do banco de dados:", error);
    return null;
  }
};
