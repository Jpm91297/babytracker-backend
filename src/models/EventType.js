import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

// Exists only so the Events.Type foreign key rejects unknown types
export const EventTypes = sequelize.define('EventTypes', {
    Name: { type: DataTypes.STRING(50), primaryKey: true },
}, { tableName: 'EventTypes', timestamps: false });
