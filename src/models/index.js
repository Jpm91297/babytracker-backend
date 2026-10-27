import { Children } from './Child.js';
import { ChildCaregivers } from './ChildCaregiver.js';
import { Events } from './Event.js';
import { EventTypes } from './EventType.js';
import { Invites } from './Invite.js';
import { Users } from './User.js';


// Many-to-many relation between children and users
Users.belongsToMany(Children, { through: ChildCaregivers, foreignKey: 'UserId', otherKey: 'ChildId', as: 'children', onDelete: 'NO ACTION' });
Children.belongsToMany(Users, { through: ChildCaregivers, foreignKey: 'ChildId', otherKey: 'UserId', as: 'caregivers', onDelete: 'CASCADE' });

// Represents many-to-many relation between children & users
ChildCaregivers.belongsTo(Children, { foreignKey: 'ChildId', as: 'child', onDelete: 'CASCADE' });
ChildCaregivers.belongsTo(Users, { foreignKey: 'UserId', as: 'user', onDelete: 'NO ACTION' });

// One-to-many relation between Children & Invites
Children.hasMany(Invites, { foreignKey: 'ChildId', as: 'invites', onDelete: 'CASCADE' });
Invites.belongsTo(Children, { foreignKey: 'ChildId', as: 'child', onDelete: 'CASCADE' });

// One-to-many relation between Children & Invites
Children.hasMany(Events, { foreignKey: 'ChildId', as: 'events', onDelete: 'CASCADE' });
Events.belongsTo(Children, { foreignKey: 'ChildId', as: 'child', onDelete: 'CASCADE' });

Events.belongsTo(Users, { foreignKey: 'LoggedBy', as: 'loggedByUser', onDelete: 'NO ACTION' });
Events.belongsTo(Users, { foreignKey: 'UpdatedBy', as: 'updatedByUser', onDelete: 'NO ACTION' });

export { Children, ChildCaregivers, Events, EventTypes, Invites, Users };
