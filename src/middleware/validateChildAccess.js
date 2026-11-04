import { Children, ChildCaregivers } from '../models/index.js';


// Validate User has access to child, returns child and users role of child
export async function validateChildAccess(childId, userId) {
    const membership =  await ChildCaregivers.findOne({
        where: { ChildId: childId, UserId: userId },
        include: [{ model: Children, as: 'child', required: true }],
    });

    if (!membership) throw new HttpError(404, 'Child not found');
    return membership;
}