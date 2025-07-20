import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Job } from 'bull';
import Logger from 'src/logger';

@Processor('email-verification')
@Injectable()
export class EmailVerificationProcessor {
  constructor(private readonly authService: AuthService) {}

  private logger = new Logger();
  @Process({ name: 'register', concurrency: 3 })
  async handleEmailVerification(job: Job) {
    const { email, token } = job.data;
    await this.authService.sendEmailVerification(email, token);
  }

  @Process({ name: 'forgot-password', concurrency: 3 })
  async handleEmailVerificationForgotPassword(job: Job) {
    const { email, token } = job.data;
    await this.authService.sendEmailVerificationForgotPassword(email, token);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.log(`Job with ${job.id} compeleted`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: any) {
    console.error(`Job failed: ${job.name}`, error);
  }
}
