import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Users = sequelize.define('Users', {
    Id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    Name: { type: DataTypes.STRING(100), allowNull: false },
    Email: { type: DataTypes.STRING(320), allowNull: false, unique: true },
    PasswordHash: { type: DataTypes.STRING(300), allowNull: false },
    CreatedAt: DataTypes.DATE,
    UpdatedAt: DataTypes.DATE,
}, { tableName: 'Users', timestamps: true, createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' });
