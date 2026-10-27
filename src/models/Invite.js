import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { ROLES } from './ChildCaregiver.js';

// The table has CreatedAt but no UpdatedAt
export const Invites = sequelize.define('Invites', {
    Code: { type: DataTypes.STRING(12), primaryKey: true },
    ChildId: { type: DataTypes.UUID, allowNull: false },
    Role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'caregiver', validate: { isIn: [ROLES] } },
    CreatedBy: { type: DataTypes.UUID, allowNull: false },
    CreatedAt: DataTypes.DATE,
    ExpiresAt: { type: DataTypes.DATE, allowNull: false },
    AcceptedBy: { type: DataTypes.UUID, allowNull: true },
    AcceptedAt: { type: DataTypes.DATE, allowNull: true },
    RevokedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'Invites', timestamps: true, createdAt: 'CreatedAt', updatedAt: false });
