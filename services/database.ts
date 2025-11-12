import { AppState } from '../types';

// Declara o initSqlJs que será carregado do script no HTML
declare const initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<any>;

let db: any = null;

const DB_KEY = 'agendaLinkState';
const IDB_NAME = 'agendalink-sqlite-db';
const IDB_STORE = 'database-store';
const IDB_KEY = 'sqlite-db-file';

// --- IndexedDB Helper Functions ---
function openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(IDB_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getFromIDB(key: string): Promise<any> {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(IDB_STORE, 'readonly');
        const store = transaction.objectStore(IDB_STORE);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveToIDB(key: string, value: any) {
    const idb = await openIDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = idb.transaction(IDB_STORE, 'readwrite');
        const store = transaction.objectStore(IDB_STORE);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}


// Inicializa o banco de dados. Será chamado uma vez no App.tsx.
export const initDatabase = async () => {
  if (db) return; // Já inicializado
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const dbFile = await getFromIDB(IDB_KEY);

    db = dbFile ? new SQL.Database(dbFile) : new SQL.Database();
    
    // Cria a tabela se ela não existir. Usamos uma tabela chave-valor simples
    // para imitar o localStorage e minimizar as mudanças na arquitetura.
    db.run(`
      CREATE TABLE IF NOT EXISTS app_storage (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  } catch (error: any) {
    console.error("Erro ao inicializar o banco de dados:", error);
  }
};

// Salva o estado completo da aplicação no banco de dados e persiste no IndexedDB.
export const saveStateToDB = async (state: AppState) => {
  if (!db) return;
  try {
    const stateString = JSON.stringify(state);
    db.run("INSERT OR REPLACE INTO app_storage (key, value) VALUES (?, ?)", [DB_KEY, stateString]);
    
    const dbExport = db.export();
    await saveToIDB(IDB_KEY, dbExport);
  } 
// Fix: Explicitly type the caught error object as 'any' to resolve the TypeScript compilation error.
  catch (error: any) {
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
  } catch (error: any) {
    console.error("Erro ao carregar o estado do banco de dados:", error);
    return null;
  }
};