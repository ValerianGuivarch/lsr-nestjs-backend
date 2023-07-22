/* eslint-disable */
export type Schema = {
  'db_account': {
    plain: {
      'id': number;
      'name': string;
      'email': string;
      'password': string;
      'authority': string;
      'secret': string;
      'state': string;
      'createdDate': string;
      'updatedDate': string;
    };
    nested: {};
    flat: {};
  };
  'db_profile': {
    plain: {
      'id': number;
      'accountId': string;
      'createdDate': string;
      'updatedDate': string;
    };
    nested: {};
    flat: {};
  };
};
