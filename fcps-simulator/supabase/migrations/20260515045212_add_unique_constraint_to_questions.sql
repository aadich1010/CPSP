-- Remove duplicate questions, keeping the oldest one
DELETE FROM public.questions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY question_text ORDER BY created_at ASC) as row_num
        FROM public.questions
    ) as subquery
    WHERE row_num > 1
);

-- Add unique constraint to question_text
ALTER TABLE public.questions 
ADD CONSTRAINT questions_question_text_key UNIQUE (question_text);
