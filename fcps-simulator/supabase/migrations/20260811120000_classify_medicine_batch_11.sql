-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 11: fetched the 100 lowest-id 'Medicine' rows; 53 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 47 genuinely new rows, 45 reclassified, 2 left as genuine
-- clinical case-vignettes.
-- Running total: 810 of 1705 processed (by DB count), 895 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Pharmacology' where id in (
'805cb8d3-3951-4def-9a3a-04fc558c8da5','81596a5b-e008-4785-8c6b-e94f33f96e54','816c6ac7-e4d1-4144-8eb7-7e3cd542e112','84ef22cc-dc79-4c7e-88d3-bdaa733631a7','857f52a4-c39f-4e37-81f8-ce0bd8ba6483'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'8084bf76-9db7-4155-83e0-d21145f792ed','80afdccc-930a-4b84-986e-7916bbc0a27b','819a2c6f-c66b-4bd4-8d1c-db3feb5a8e37','81edc4cb-1b96-48cf-b48e-a65cab9eb068','8201b046-e8ca-4d25-ab61-cc925490c895','82435e88-3979-48e4-a20d-e249affeed79','8249ea28-3cbf-4958-9d52-6d0d17adaff5','8286aad1-5a28-4295-8a87-33e0f26f9743','8341db00-960f-44ce-a163-b4abdea6f926','8369b536-986b-4060-9882-a885a682a35d','8394a804-d935-47cb-8e51-3a595859adcc','846f0b2f-8ed0-4638-adc4-d5044b6759c2','850e69ab-4746-4aad-93a0-cf3c46d28ef2','85a1b213-522b-4322-8e41-41d0e0d4ad3d'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'809eb97a-72c0-4c13-9591-c1bb0957ed28','8162fcd2-39be-4516-a9d3-2876208452fb','8165b3ff-cc05-456a-ab6c-6e44c9d36b17','83eb3943-6b3c-4e09-9386-3ae9e69c6c21'
);
update public.questions set subject = 'Immunology' where id in ('80e7b316-5333-4b86-953e-962145105ecc');
update public.questions set subject = 'Applied Physiology' where id in (
'81025958-d6d3-4396-acc4-472e275ca6ea','82ad9477-0c41-4dd2-9465-47e6c84a50e3','82b4caf8-b794-4537-9355-97f189b0ddc2','82e32657-1501-4175-8d60-783b44682abc','8350898f-618b-44fb-9b06-2711f4af9f33','84038ee4-0c25-4d97-94c4-04103a5b51e2','842729b8-e841-4e89-90a4-9194ab45ca2b','84a0f94e-4bf3-49b8-90ab-ab093ac53ba5','84c098f7-8947-40e7-a8e6-ed418205d451'
);
update public.questions set subject = 'Applied Pathology' where id in (
'814a5a40-1913-47f2-b89e-892dcebb1143','82531476-de3c-483f-9208-10da8627a689','834465fb-69ba-4998-87eb-a70cefcbc5bf','8347be98-e171-43dc-8eba-f3a504f09c2b','8399f03d-37f9-431f-9fb4-92447df3078e','84725db8-3cfe-4671-895b-6484fa660f0e','85a8bbc6-2093-4f38-8687-60a672c61e54'
);
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('82a40352-527c-4c5d-a66a-5646fb22fd9c','84e658d6-bca6-4c77-9af6-b9fbe145dabe','85a52fef-eed2-433d-9534-f532beba3f77');
update public.questions set subject = 'Microbiology' where id in ('850acdbc-d6c6-4026-9252-dfb8c07bfd3b','856e63a5-7b5c-452b-9f7f-f09e3d1017d0');
