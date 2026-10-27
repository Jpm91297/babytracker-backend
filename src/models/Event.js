import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Events = sequelize.define('Events', {
    Id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    ChildId: { type: DataTypes.UUID, allowNull: false },
    Type: { type: DataTypes.STRING(50), allowNull: false },
    SchemaVersion: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
    StartedAt: { type: DataTypes.DATE, allowNull: false },
    EndedAt: { type: DataTypes.DATE, allowNull: true },
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
    UpdatedBy: { type: DataTypes.UUID, allowNull: true },
    CreatedAt: DataTypes.DATE,
    UpdatedAt: DataTypes.DATE,
    DeletedAt: DataTypes.DATE,
}, {
    tableName: 'Events',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    paranoid: true,
    validate: {
        endedAfterStarted() {
            if (this.EndedAt && this.EndedAt < this.StartedAt) throw new Error('EndedAt must be on or after StartedAt');
        },
    },
});
