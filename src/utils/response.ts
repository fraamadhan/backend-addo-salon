class Result {
  status!: number;
  error!: boolean;
  message!: string;
  data?: any;
}

export const responseSuccess = (
  code: number,
  message: string = 'Success',
  data?: any,
) => {
  const result: Result = {
    status: code,
    error: false,
    message: message,
  };

  if (data) {
    result.data = data as object;
  }

  return result;
};

export const responseError = (code: number, error: string) => {
  const result: Result = {
    status: code,
    error: true,
    message: error,
  };

  return result;
};
