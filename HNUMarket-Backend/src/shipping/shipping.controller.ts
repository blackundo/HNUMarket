import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/shipping-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/shipping')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get('locations')
  findAllLocations() {
    return this.shippingService.findAllLocations();
  }

  @Get('locations/:id')
  findLocation(@Param('id') id: string) {
    return this.shippingService.findLocation(id);
  }

  @Post('locations')
  createLocation(@Body() dto: CreateLocationDto) {
    return this.shippingService.createLocation(dto);
  }

  @Patch('locations/:id')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.shippingService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  deleteLocation(@Param('id') id: string) {
    return this.shippingService.deleteLocation(id);
  }
}
