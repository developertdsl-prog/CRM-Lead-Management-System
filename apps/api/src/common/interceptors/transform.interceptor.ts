import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@crm/shared-types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Handle pagination responses where data has { items, pagination }
        if (data && typeof data === 'object' && 'pagination' in data && 'items' in data) {
          return {
            success: true,
            statusCode: response.statusCode,
            data: data.items,
            meta: {
              pagination: data.pagination,
              timestamp: new Date().toISOString(),
              path: request.url,
            },
          };
        }

        return {
          success: true,
          statusCode: response.statusCode,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}
