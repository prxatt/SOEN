// Themes Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { ThemeSchema } from '../types/ai';

// Themes input schemas
const CreateThemeSchema = z.object({
  name: z.string().min(1).max(100),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i),
    background: z.string().regex(/^#[0-9A-F]{6}$/i),
    text: z.string().regex(/^#[0-9A-F]{6}$/i),
  }),
  fonts: z.object({
    heading: z.string().min(1).max(100),
    body: z.string().min(1).max(100),
  }),
});

const UpdateThemeSchema = z.object({
  themeId: z.string(),
  name: z.string().min(1).max(100).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    background: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    text: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  }).optional(),
  fonts: z.object({
    heading: z.string().min(1).max(100).optional(),
    body: z.string().min(1).max(100).optional(),
  }).optional(),
});

const ApplyThemeSchema = z.object({
  themeId: z.string(),
});

export const themesRouter = router({
  // Create custom theme
  createTheme: protectedProcedure
    .input(CreateThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newTheme } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          name: input.name,
          colors: input.colors,
          fonts: input.fonts,
          is_custom: true,
          is_active: false,
        })
        .select()
        .single();

      return newTheme;
    }),

  // Update theme
  updateTheme: protectedProcedure
    .input(UpdateThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.colors !== undefined) updateData.colors = input.colors;
      if (input.fonts !== undefined) updateData.fonts = input.fonts;

      const { data: updatedTheme } = await supabase
        .from('themes')
        .update(updateData)
        .eq('id', input.themeId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedTheme;
    }),

  // Apply theme
  applyTheme: protectedProcedure
    .input(ApplyThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Deactivate all other themes
      await supabase
        .from('themes')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected theme
      const { data: appliedTheme } = await supabase
        .from('themes')
        .update({ is_active: true })
        .eq('id', input.themeId)
        .eq('user_id', user.id)
        .select()
        .single();

      return appliedTheme;
    }),

  // Get user's themes
  getThemes: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: themes } = await supabase
        .from('themes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return themes || [];
    }),

  // Get active theme
  getActiveTheme: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: activeTheme } = await supabase
        .from('themes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      return activeTheme;
    }),

  // Get preset themes
  getPresetThemes: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase } = ctx;
      
      const { data: presetThemes } = await supabase
        .from('themes')
        .select('*')
        .eq('is_custom', false)
        .eq('is_active', true)
        .order('name');

      return presetThemes || [];
    }),

  // Delete theme
  deleteTheme: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Check if theme is custom (can only delete custom themes)
      const { data: theme } = await supabase
        .from('themes')
        .select('is_custom')
        .eq('id', input.themeId)
        .eq('user_id', user.id)
        .single();

      if (!theme?.is_custom) {
        throw new Error('Cannot delete preset themes');
      }

      await supabase
        .from('themes')
        .delete()
        .eq('id', input.themeId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Duplicate theme
  duplicateTheme: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get original theme
      const { data: originalTheme } = await supabase
        .from('themes')
        .select('*')
        .eq('id', input.themeId)
        .eq('user_id', user.id)
        .single();

      if (!originalTheme) {
        throw new Error('Theme not found');
      }

      // Create duplicate
      const { data: duplicatedTheme } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          name: `${originalTheme.name} (Copy)`,
          colors: originalTheme.colors,
          fonts: originalTheme.fonts,
          is_custom: true,
          is_active: false,
        })
        .select()
        .single();

      return duplicatedTheme;
    }),

  // Export theme
  exportTheme: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: theme } = await supabase
        .from('themes')
        .select('*')
        .eq('id', input.themeId)
        .eq('user_id', user.id)
        .single();

      if (!theme) {
        throw new Error('Theme not found');
      }

      return {
        name: theme.name,
        colors: theme.colors,
        fonts: theme.fonts,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
    }),

  // Import theme
  importTheme: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      colors: z.object({
        primary: z.string().regex(/^#[0-9A-F]{6}$/i),
        secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
        accent: z.string().regex(/^#[0-9A-F]{6}$/i),
        background: z.string().regex(/^#[0-9A-F]{6}$/i),
        text: z.string().regex(/^#[0-9A-F]{6}$/i),
      }),
      fonts: z.object({
        heading: z.string().min(1).max(100),
        body: z.string().min(1).max(100),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: importedTheme } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          name: input.name,
          colors: input.colors,
          fonts: input.fonts,
          is_custom: true,
          is_active: false,
        })
        .select()
        .single();

      return importedTheme;
    }),

  // Get theme analytics
  getThemeAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: themes } = await supabase
        .from('themes')
        .select('id, name, is_active, created_at, updated_at')
        .eq('user_id', user.id);

      const totalThemes = themes?.length || 0;
      const customThemes = themes?.filter(theme => theme.is_custom).length || 0;
      const presetThemes = totalThemes - customThemes;
      const activeTheme = themes?.find(theme => theme.is_active);

      return {
        totalThemes,
        customThemes,
        presetThemes,
        activeTheme: activeTheme?.name || 'Default',
        mostUsedTheme: activeTheme?.name || 'Default',
      };
    }),

  // Reset to default theme
  resetToDefault: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      // Deactivate all themes
      await supabase
        .from('themes')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Find and activate default theme
      const { data: defaultTheme } = await supabase
        .from('themes')
        .select('*')
        .eq('name', 'Default')
        .eq('is_custom', false)
        .single();

      if (defaultTheme) {
        await supabase
          .from('themes')
          .update({ is_active: true })
          .eq('id', defaultTheme.id);
      }

      return { success: true };
    }),
});

