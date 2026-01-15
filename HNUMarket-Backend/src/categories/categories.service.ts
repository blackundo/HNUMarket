import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

/**
 * Categories Service
 *
 * Handles all category CRUD operations using Supabase Admin client
 * to bypass RLS policies for admin operations.
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Find all categories with pagination and filters
   */
  async findAll(query: CategoryQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const {
      page,
      limit,
      search,
      parentId,
      isActive: isActiveStr,
      sortBy,
      sortOrder,
    } = query;

    // Convert string to boolean
    let isActive: boolean | undefined;
    if (isActiveStr !== undefined) {
      isActive = isActiveStr === 'true';
    }

    let queryBuilder = supabase
      .from('categories')
      .select('*, parent:categories!parent_id(id, name, slug)', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('name', `%${search}%`);
    }
    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder = queryBuilder.is('parent_id', null);
      } else {
        queryBuilder = queryBuilder.eq('parent_id', parentId);
      }
    }
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }

    // Map sortBy to database column names
    const sortColumn = sortBy === 'created_at' ? 'created_at' : 
                      sortBy === 'display_order' ? 'display_order' : 
                      'name';
    
    queryBuilder = queryBuilder
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      throw new Error(error.message);
    }

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find single category by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories!parent_id(id, name, slug)')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Category not found: ${id}`);
      throw new NotFoundException('Category not found');
    }

    return data;
  }

  /**
   * Create new category
   */
  async create(dto: CreateCategoryDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', dto.slug)
      .single();

    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    // Validate parent exists if provided
    if (dto.parentId) {
      const { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('id', dto.parentId)
        .single();

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image_url: dto.imageUrl,
        parent_id: dto.parentId || null,
        display_order: dto.displayOrder ?? 0,
        is_active: dto.isActive ?? true,
      })
      .select('*, parent:categories!parent_id(id, name, slug)')
      .single();

    if (error) {
      this.logger.error(`Failed to create category: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Category created: ${category.id}`);
    return category;
  }

  /**
   * Update existing category
   */
  async update(id: string, dto: UpdateCategoryDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check category exists
    await this.findOne(id);

    // Check if slug already exists (if being updated)
    if (dto.slug) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', dto.slug)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Validate parent exists if provided
    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        // Setting to null is allowed
      } else if (dto.parentId === id) {
        throw new Error('Category cannot be its own parent');
      } else {
        const { data: parent } = await supabase
          .from('categories')
          .select('id')
          .eq('id', dto.parentId)
          .single();

        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }

        // Check for circular reference (parent cannot be a descendant)
        const { data: descendants } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', id);

        if (descendants?.some((d) => d.id === dto.parentId)) {
          throw new Error('Cannot set parent: would create circular reference');
        }
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
    if (dto.parentId !== undefined) updateData.parent_id = dto.parentId;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to update category: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Category updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Delete category
   */
  async remove(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Check if category has children
    const { data: children } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id);

    if (children && children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // Check if category is used by products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (products && products.length > 0) {
      throw new Error('Cannot delete category that is assigned to products');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete category: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Category deleted: ${id}`);
    return { message: 'Category deleted' };
  }

  /**
   * Reorder categories
   *
   * Updates display_order for categories within the same parent level.
   * Validates all categories share the same parent_id.
   */
  async reorder(dto: ReorderCategoriesDto) {
    const supabase = this.supabaseAdmin.getClient();
    const { ids } = dto;

    if (ids.length === 0) {
      throw new Error('No categories to reorder');
    }

    // Fetch all categories to validate they exist and have same parent
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, parent_id')
      .in('id', ids);

    if (fetchError) {
      this.logger.error(`Failed to fetch categories: ${fetchError.message}`);
      throw new Error(fetchError.message);
    }

    if (!categories || categories.length !== ids.length) {
      throw new Error('One or more categories not found');
    }

    // Validate all categories have the same parent_id
    const parentIds = new Set(categories.map(c => c.parent_id));
    if (parentIds.size > 1) {
      throw new Error('Cannot reorder categories with different parents');
    }

    // Update display_order for each category based on its position in the array
    const updates = ids.map((id, index) => ({
      id,
      display_order: index,
    }));

    // Execute updates in parallel
    const promises = updates.map((update) =>
      supabase
        .from('categories')
        .update({
          display_order: update.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id),
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      this.logger.error(`Failed to reorder categories: ${errors[0].error.message}`);
      throw new Error('Failed to reorder categories');
    }

    this.logger.log(`Categories reordered: ${ids.length} categories`);
    return { message: 'Categories reordered successfully' };
  }
}

