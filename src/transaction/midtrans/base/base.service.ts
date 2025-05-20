import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import Logger from 'src/logger';
import { MidtransError } from '../custom-midtrans-error';
import { MidtransChargeResponseType } from '../dto/response';

export abstract class BaseService {
  constructor(private readonly httpService: HttpService) {}

  private readonly logger = new Logger();

  protected async handleRequest(
    method:
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'PATCH'
      | 'DELETE'
      | 'get'
      | 'post'
      | 'put'
      | 'patch'
      | 'delete',
    url: string,
    payload?: Record<string, any>,
  ) {
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      data: payload,
    };

    const response = await firstValueFrom(
      this.httpService.request<MidtransChargeResponseType>(config).pipe(
        catchError((error: any) => {
          let errorMsg;
          if (error instanceof AxiosError) {
            errorMsg =
              error.response && error.response.data
                ? JSON.stringify(error.response.data)
                : 'Error during payment to midtrans';
          }
          this.logger.errorString(errorMsg as string);
          throw new MidtransError('Midtrans error', errorMsg as string);
        }),
      ),
    );

    return response.data;
  }
}
