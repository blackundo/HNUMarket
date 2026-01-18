import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase/supabase.module';
import { R2StorageModule } from './common/storage/r2-storage.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadModule } from './upload/upload.module';
import { PostsModule } from './posts/posts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ShippingModule } from './shipping/shipping.module';
import { SettingsModule } from './settings/settings.module';
import { StorefrontModule } from './storefront/storefront.module';
import { HeroSlidesModule } from './hero-slides/hero-slides.module';
import { HomepageSectionsModule } from './homepage-sections/homepage-sections.module';
import { PagesModule } from './pages/pages.module';
import { OrdersModule } from './orders/orders.module';
import supabaseConfig from './config/supabase.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [supabaseConfig],
    }),
    SupabaseModule,
    R2StorageModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UploadModule,
    PostsModule,
    DashboardModule,
    ShippingModule,
    SettingsModule,
    StorefrontModule,
    HeroSlidesModule,
    HomepageSectionsModule,
    PagesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule { }
