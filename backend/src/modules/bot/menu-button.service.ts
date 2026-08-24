import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class MenuButtonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MenuButtonService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const url = this.config.get<string>('WEBAPP_URL');
    if (!url) {
      this.logger.log('WEBAPP_URL not set, skipping menu button registration');
      return;
    }
    try {
      await this.bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Відкрити каталог',
          web_app: { url },
        },
      } as any);
      this.logger.log(`Menu button set to ${url}`);
    } catch (err) {
      this.logger.warn(`Failed to set menu button: ${err.message}`);
    }
  }
}
