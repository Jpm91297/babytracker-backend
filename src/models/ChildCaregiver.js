import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const ROLES = ['owner', 'caregiver'];

export const ChildCaregivers = sequelize.define('ChildCaregivers', {
    ChildId: { type: DataTypes.UUID, primaryKey: true },
    UserId: { type: DataTypes.UUID, primaryKey: true },
    Role: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [ROLES] } },
    AddedBy: { type: DataTypes.UUID, allowNull: true },
    CreatedAt: DataTypes.DATE,
}, { tableName: 'ChildCaregivers', timestamps: true, createdAt: 'CreatedAt', updatedAt: false });
