import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'HNUMarket Backend API is running!';
  }
}
