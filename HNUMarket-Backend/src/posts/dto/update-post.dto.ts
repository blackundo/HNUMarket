import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

/**
 * Update Post DTO
 *
 * Makes all CreatePostDto fields optional for partial updates.
 */
export class UpdatePostDto extends PartialType(CreatePostDto) {}
