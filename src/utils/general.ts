import { Types } from 'mongoose';

export const toObjectId = (id: Types.ObjectId | string) => {
  if (!id) {
    return null;
  }
  return new Types.ObjectId(id);
};
