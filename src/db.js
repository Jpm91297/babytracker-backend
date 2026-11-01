import 'dotenv/config';
import { Sequelize } from 'sequelize';

// Fetch Environment Var, throw err if not present
function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
    return value;
}

const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const instanceName = process.env.DB_INSTANCE || undefined;

export const sequelize = new Sequelize(requireEnv('DB_NAME'), requireEnv('DB_USER'), requireEnv('DB_PASSWORD'), {
    dialect: 'mssql',
    host: requireEnv('DB_SERVER'),
    // A port and an instance name are mutually exclusive in tedious; the port wins.
    ...(port ? { port } : {}),
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true,
            ...(!port && instanceName ? { instanceName } : {}),
        },
    },
    logging: false,
});

// Sequelize formats SQL `date` columns in the server's timezone, which reads them a day early west of UTC
sequelize.connectionManager.refreshTypeParser({
    DATEONLY: { types: { mssql: [40] }, parse: (value) => value.toISOString().slice(0, 10) },
});

export async function connectDb() {
    try {
        await sequelize.authenticate();
        console.log(`Connected to SQL Server database "${process.env.DB_NAME}"`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
            [
                `Could not connect to SQL Server: ${message}`,
                'Check that:',
                '  - TCP/IP is enabled in SQL Server Configuration Manager (then restart the service)',
                '  - for a named instance, DB_INSTANCE is set and SQL Server Browser is running, or DB_PORT is set',
                '  - SQL Server and Windows Authentication mode is enabled and DB_USER/DB_PASSWORD are a valid SQL login',
            ].join('\n'),
        );
        throw err;
    }
}
