import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Events = sequelize.define('Events', {
    Id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    ChildId: { type: DataTypes.UUID, allowNull: false },
    Type: { type: DataTypes.STRING(50), allowNull: false },
    StartedAt: { type: DataTypes.DATE, allowNull: false },
    Details: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const raw = this.getDataValue('Details');
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        },
        set(value) {
            this.setDataValue('Details', JSON.stringify(value));
        },
    },
    Notes: { type: DataTypes.STRING(500), allowNull: true },
    LoggedBy: { type: DataTypes.UUID, allowNull: false },
    CreatedAt: DataTypes.DATE,
    UpdatedAt: DataTypes.DATE,
}, { tableName: 'Events', timestamps: true, createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' });
