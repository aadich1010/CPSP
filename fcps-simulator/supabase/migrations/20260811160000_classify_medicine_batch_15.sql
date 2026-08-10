-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 15: fetched the 100 lowest-id 'Medicine' rows; 62 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- 2 corrupted rows), skipped again.
-- Of the 38 genuinely new rows, 37 reclassified, 1 left as a genuine
-- clinical case-vignette.
-- Running total: 969 of 1705 processed (by DB count), 736 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Anesthesia' where id in ('97cc318e-09e8-4e8a-b7c3-122aa7e1960c','99ce5a86-dde8-46a1-993f-b8bb9f3ca572');
update public.questions set subject = 'Applied Physiology' where id in (
'980bf652-069f-4c71-90a5-a1341bcf9d42','9869014c-d3f3-4e85-a7fd-d191afbe416d','98ac5e13-5f2c-4ecc-a27f-25c4a041c747','99c500bb-20ad-43b2-8848-56f01b3f8047','9b3ddecb-0cc9-4b18-99e3-a7bfa04f6075','9cdf969a-8cb4-4e91-b272-6fd5892e1aed','9db6d6f1-e38c-42dc-8231-fd514262950f','9dd89abf-66c1-4264-87a0-3408b7368023'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'984a1898-12c0-41b9-a3ec-36db5e0a665d','9880f4e3-dd27-40b8-abbc-ca85a831a324','98f167ef-ef47-4d4f-a145-62f0ceeb2477','9b5e5b0e-8a31-433a-b0e1-80ab430d9004','9b6d009d-eb45-4e59-a3f7-a8673e61486e','9ca78e5c-7a08-4ff6-acf2-6aed7f8c63b7','9ca8f526-257a-4cf2-92da-7b1c8649d6b7'
);
update public.questions set subject = 'Applied Biochemistry' where id in ('9856afb7-8c1a-41c8-9ccb-94251ec74be9','99ed4d8c-4c29-4801-9c5f-7f0793559667');
update public.questions set subject = 'Applied Pathology' where id in (
'9934d67a-b4bb-4596-ac10-f593d6e792b4','99390eba-e59c-4ed3-afca-d15edfe177f1','9b4746bf-c7f2-4d8f-859b-e81d135cd7ee','9b53bdec-b8fd-445c-a457-745488e8df4d','9bd4dcf3-d4f2-4419-be21-27a5b3b5512c','9c5f1203-9110-4c77-a0da-96e91791a9e6','9dab8cdf-7b4a-45dd-a3ae-209d52f3dde7','9e965deb-c227-419d-b8cd-a8416be7928b'
);
update public.questions set subject = 'Immunology' where id in ('9998bb10-d061-43c2-adea-73cc948a4aa1','9a08e771-6ec2-45b0-9b30-40b963475d4b','9a742c7d-a658-4c62-9ce6-0b033ffd94ea');
update public.questions set subject = 'Applied Pharmacology' where id in ('9c97772c-f6c0-4725-adc5-324af31b11eb','9e4fe7b9-d3ca-4d15-8e7e-0468d2fd9e03');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('9c9ad3a6-db1c-4d7f-a42b-ba6db9c8e367');
update public.questions set subject = 'Pediatrics' where id in ('9b57e085-47ab-4ebd-aaef-e76dcf2be343');
update public.questions set subject = 'Microbiology' where id in ('9dffe599-77b3-4b0f-afe0-6a1ae1ce3b2b','9e8ecf2c-37b8-49c1-a426-05e3ada4badc');
update public.questions set subject = 'Medical Ethics & Professionalism' where id in ('9e4a0694-dfcd-4fc4-8aa5-161f4baa2966');
