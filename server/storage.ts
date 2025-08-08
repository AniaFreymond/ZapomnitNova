import { supabase } from "../db";
import { FlashcardInsert, TagInsert } from "@shared/schema";

export const storage = {
  // Flashcard operations
  async getAllFlashcards(userId: string) {
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        tags: flashcard_tags (
          tag: tags (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (flashcards || []).map(card => ({
      ...card,
      tags: card.tags.map((t: any) => t.tag)
    }));
  },

  async getFlashcardById(id: number, userId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        tags: flashcard_tags (
          tag: tags (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      tags: data.tags.map((t: any) => t.tag)
    };
  },

  async searchFlashcards(query: string, tagIds: number[] | undefined, userId: string) {
    let supabaseQuery = supabase
      .from('flashcards')
      .select(`
        *,
        tags: flashcard_tags (
          tag: tags (*)
        )
      `)
      .eq('user_id', userId);

    if (query) {
      supabaseQuery = supabaseQuery.or(`front.ilike.%${query}%,back.ilike.%${query}%`);
    }

    if (tagIds && tagIds.length > 0) {
      const { data: flashcardIds } = await supabase
        .from('flashcard_tags')
        .select('flashcard_id')
        .in('tag_id', tagIds);

      if (flashcardIds && flashcardIds.length > 0) {
        supabaseQuery = supabaseQuery.in('id', flashcardIds.map(f => f.flashcard_id));
      } else {
        return [];
      }
    }

    const { data: cards, error } = await supabaseQuery.order('created_at', { ascending: false });

    if (error) throw error;
    return (cards || []).map(card => ({
      ...card,
      tags: card.tags.map((t: any) => t.tag)
    }));
  },

  async createFlashcard(data: FlashcardInsert, tagIds: number[] = [], userId: string) {
    const { data: newCard, error } = await supabase
      .from('flashcards')
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        flashcard_id: newCard.id,
        tag_id: tagId
      }));

      const { error: tagError } = await supabase
        .from('flashcard_tags')
        .insert(tagRelations);

      if (tagError) throw tagError;
    }

    return this.getFlashcardById(newCard.id, userId);
  },

  async updateFlashcard(id: number, data: Partial<FlashcardInsert>, tagIds: number[] | undefined, userId: string) {
    const { error } = await supabase
      .from('flashcards')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    if (tagIds !== undefined) {
      const { error: deleteError } = await supabase
        .from('flashcard_tags')
        .delete()
        .eq('flashcard_id', id);

      if (deleteError) throw deleteError;

      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          flashcard_id: id,
          tag_id: tagId
        }));

        const { error: insertError } = await supabase
          .from('flashcard_tags')
          .insert(tagRelations);

        if (insertError) throw insertError;
      }
    }

    return this.getFlashcardById(id, userId);
  },

  async deleteFlashcard(id: number, userId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAllFlashcards(userId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  },

  // Tag operations
  async getAllTags(userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async getTagById(id: number, userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async createTag(data: TagInsert, userId: string) {
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return newTag;
  },

  async updateTag(id: number, data: Partial<TagInsert>, userId: string) {
    const { data: updatedTag, error } = await supabase
      .from('tags')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return updatedTag;
  },

  async deleteTag(id: number, userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};