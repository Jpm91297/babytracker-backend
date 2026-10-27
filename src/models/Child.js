import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Children = sequelize.define('Children', {
    Id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    Name: { type: DataTypes.STRING(100), allowNull: false },
    BirthDate: { type: DataTypes.DATEONLY, allowNull: true },
    CreatedBy: { type: DataTypes.UUID, allowNull: false },
    CreatedAt: DataTypes.DATE,
    UpdatedAt: DataTypes.DATE,
    DeletedAt: DataTypes.DATE,
}, { tableName: 'Children', timestamps: true, createdAt: 'CreatedAt', updatedAt: 'UpdatedAt', deletedAt: 'DeletedAt', paranoid: true }
);
