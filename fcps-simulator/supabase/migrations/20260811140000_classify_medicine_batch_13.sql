-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 13: fetched the 100 lowest-id 'Medicine' rows; 57 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 43 genuinely new rows, 41 reclassified, 2 left as genuine
-- clinical case-vignettes.
-- Running total: 894 of 1705 processed (by DB count), 811 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Medical Ethics & Professionalism' where id in ('8b4f9985-bdae-4aee-99bd-7ea09ae5bd03');
update public.questions set subject = 'Microbiology' where id in (
'8b61eca2-7626-4b90-815b-d1e722af64dd','8ca3a868-f43a-495a-ac61-f50a4c0fdce8','8e1aff43-7855-4cf6-92d2-d651ce41d3cd','8f6d8ad2-864c-4c30-ab4d-a7612433d80d','9088ea26-87c2-475a-b194-72d66baaa8fd'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'8b8877fc-59f8-495b-b59c-9ee7404dc2a7','8d1edf15-9404-47a0-a888-508a57e8da3d','8d66d3da-88d9-4458-a118-175bbbce11db','8d69c9b5-35dc-48c4-8d96-51ac4d7d11fa','8e13fa7e-da65-487e-9e0b-544c669ce0fe','903000cc-f077-448e-8af1-a457be2a33bf','904e337e-a22e-4291-ab74-3ae45f2940b3','90996571-790a-4ac1-96eb-ff1713feb5c8'
);
update public.questions set subject = 'Applied Physiology' where id in (
'8bc10e5a-227b-42c4-b876-bbd7da8fd98b','8bf4a1e2-5ea3-4687-91af-d48059cf08f3','8c0624ba-5228-4fe2-b08e-7d0fb55717c1','8e853874-7ea0-4de3-9058-f84ce1176466','8e99ee4c-f3e6-4b2f-b52e-4e74d32ad436','90e21bd5-3ea1-4117-af54-f15552a20378'
);
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('8bd5abae-7229-49f1-a854-35da0a227e5c','920ea403-3d74-4f57-affa-a2b61a0355af');
update public.questions set subject = 'Applied Pathology' where id in (
'8cc5b96f-19c3-4487-a2dc-fb8ed70e826a','8d3b86bf-92bb-4dc8-9566-6b197a4ad19c','8e801b6e-cd6e-4a1f-9220-0284c701d96e','8f0610fc-88c1-40f7-9b06-5608d3914d90','90f6fa60-fdbd-4c1e-9cba-de8cb1d56acf'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'8ce56787-9a17-4f67-894f-b631500b7468','8cfccb82-59af-40cf-8a66-28340b69937b','8d1cb6dd-8e20-47c4-a1de-ce794db2ab90','8d78fd8c-bf23-4e51-a4a9-419318086355','8fdc4e09-d71f-4b29-abbe-683bd1d7ee78','909f994c-78e7-469e-afdb-774eb21a2e54','90cee99c-901d-4c56-a18f-4c5b7109aef3','920d2213-020c-491d-9bd4-8e1ff1d8d1fc'
);
update public.questions set subject = 'Applied Biochemistry' where id in ('8dffbec2-d440-4071-89b3-5bb0a892f7cc','8f71065f-683d-4b8a-b65e-446431924f02');
update public.questions set subject = 'Immunology' where id in ('8e0a1298-35b0-4cf5-b48b-72d1ff505202','8ee059ea-3ec0-4314-9798-00bfd9fe65f5','8ff619fd-a091-4e33-8105-fb3affd407ac','9175c91a-2d54-4dfa-8430-3a734a9df7b5');
