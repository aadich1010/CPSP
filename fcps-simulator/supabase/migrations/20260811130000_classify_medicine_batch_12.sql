-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 12: fetched the 100 lowest-id 'Medicine' rows; 55 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 45 genuinely new rows, 43 reclassified, 2 left as genuine
-- clinical case-vignettes.
-- Running total: 853 of 1705 processed (by DB count), 852 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('85c4a1ef-e4f9-46af-bfe5-3571d78178de');
update public.questions set subject = 'Applied Physiology' where id in (
'85c5ab98-b2c9-4a39-be92-99a01aeaebcf','86785bb5-5bcd-4e21-b90f-71cb9bf9acde','869645a2-1338-4526-bc4f-7787452c6466','86e0c784-05ab-4796-9612-d26ea8defb21','870d9e47-01f3-4f9d-b46a-171afc55545a','8859915f-2cc4-4bfa-9cd3-fc30d706f7f2','88a04cdb-d468-4d62-a9a7-6cb497f93fe6','88b499dc-daa6-44d0-8b76-ffaecd330693','8a96da57-c9e4-4ca3-a389-c79413b4f114'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'8627d714-9604-41f7-bc6d-ec10be6d40ad','86ac4838-765f-40e0-aa06-b3c51b49fbb0','86cf7e31-ab14-4943-94aa-da436c53557a','86d6bae8-ff70-4663-9428-96303b71cc0b','8855a381-d7e9-41c6-8a77-b4c45dc16383','89119d02-deb2-40e0-a994-a05f3afa94e7','898e9876-3660-45ce-b8fd-0305314c1fab','8a99bc31-e06c-4eb7-9ece-f928d02a4567','8ad26ff1-fd0f-4279-99b8-73c28517a2eb','8b1dd9bb-f5fb-4b71-9e97-ec9caf68d0a5'
);
update public.questions set subject = 'Applied Pathology' where id in (
'86783cfc-eb16-4307-9beb-395f7210e4bb','8720f20f-bf35-47c0-889a-f1befb80e719','87a6bb67-b0a9-4021-9da0-1f3babded110','887917a5-6097-4cd6-a93c-0a1e37da8347','8881f6a1-2676-4db8-9b2e-cff609c0efff','88c27f28-b330-4f43-a55b-54e7771497ac','86fef00a-a12a-408d-aafd-0084b8cc6f4e'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'868510a6-fe49-4957-97e4-0d42270f4fc7','87191e23-3bd2-4045-9a98-ce0ee5c96cad','87449dd9-04ad-4d2d-82db-cc219733f995','87481f29-3441-4fa7-a5bd-3478ba60f6c1','8815007c-602c-401c-9631-161e78f12835','89aad6f1-7678-4401-9293-30c0130258ba','8a6989e5-058d-4918-a997-bf5241dc8ac4'
);
update public.questions set subject = 'Microbiology' where id in ('86c26bb6-225d-46e8-9648-6cf03512afd2','8b12192b-019d-4174-82d2-95e5db151db3');
update public.questions set subject = 'Pediatrics' where id in ('879de7fe-1cbb-45e7-ae1d-01e34d7b7c46','8aa54f01-3411-4fa0-a87c-1afe55acb755');
update public.questions set subject = 'ENT' where id in ('871a710d-2c57-40e4-96a0-b9fd80eff953');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('889b9727-2953-448d-97c7-6e3d080abcc0','8aae095a-c568-413f-83a2-b249ea85edca');
update public.questions set subject = 'Ophthalmology' where id in ('89f5a3b6-baa8-458b-85e5-f469db9691a8');
update public.questions set subject = 'Applied Biochemistry' where id in ('887ba1e6-8870-4c09-b4e1-1800ffe2ae89');
