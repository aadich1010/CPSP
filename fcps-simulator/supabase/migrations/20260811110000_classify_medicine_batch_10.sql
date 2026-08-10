-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 10: fetched the 100 lowest-id 'Medicine' rows; 53 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- All 47 genuinely new rows were confidently reclassified this batch
-- (0 kept -- no ambiguous/unclassifiable clinical vignettes this round).
-- Running total: 765 of 1705 processed (by DB count), 940 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Physiology' where id in (
'79623a89-3373-4164-865b-92e85f0fc012','79d76451-afb9-40a8-9b86-87725babc732','79f8b85b-cb26-4e3a-9cb7-d3e331a9b7ab','7ab2899e-c148-47b0-a030-5c4b3fe06c9f','7b0b7475-f703-42de-a659-db0dce44c474','7b35d40e-d737-459b-9113-9949719aae4c','7b36211f-1712-4be3-b67d-955a46f4a610','7c36298c-04a7-45bf-abe6-c10fbabe3e55','7c786fb5-4fe8-43c6-8ef1-b9d5f971b9b8','7ce2e7c8-3dfd-46bf-a303-8878258285d3','7df8ec72-13cc-4d00-9291-b3fe1b13b759','7e0a093e-3580-4ffb-94b4-115d1ea83c0e','7ef37d11-85f0-4eef-8c8b-c420d885889f'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'7a097779-e31b-4742-bf8e-513605554ed6','7ae51d90-1d7d-41de-a321-5a2c2de9c895','7bdc14e1-247e-42b7-8f7b-c400efe6e878','7d2ef7fc-6bd9-4c38-a234-4d9ba0589522','7d87a3c8-8ba8-4bea-87d9-c371da61549d','7db4c15c-efc9-4ca5-ba97-fac30b74ad4a','7dc7e5b2-0a7e-4d0d-a156-f516acc0ab4a','7e6fc08f-5e6c-4760-93a6-1e24def23128'
);
update public.questions set subject = 'Applied Pathology' where id in (
'7a051157-f13b-4e1c-9cff-63df13e62418','7ad78a78-c1b9-4cd1-9c17-fff46838164e','7b1701c1-bcbc-4c44-85a4-c97b9d597f20','7b901561-062d-469d-80ed-d3bb866a2fd4','7c857360-95c3-4a49-a9c9-acb7be832388','7c8f94b3-712d-437c-98c9-6056af74005e','7d57b6e3-b5fa-4c8e-853b-c90dcda6b432','7fd524f0-7c30-499c-89f0-53f6d7eca6ab','8056c1e1-0c46-48a4-936e-01b8f8cac705'
);
update public.questions set subject = 'Immunology' where id in (
'7a6c9339-86f5-44b7-9b39-091b2a754f8b','7b4df725-e37d-4ca1-9f04-ae17150927b9','7be58e66-b233-4e8d-9a91-064e1d60a80d','7e3452be-73f4-4c06-bfe6-186cd511dc90','7f5a7bd2-2ed4-4d3c-9f32-7624d437b8d7','7f77c62f-59b6-46b8-b708-0107f5e34dd3','7f7e0c65-bfc0-46b0-ad15-34917ed5338a'
);
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('7b384d0c-4714-4de0-91ba-7a1cc88f9692','7c5246ce-64aa-49e0-a7df-e2b3623fabe4','7e2b83fc-d2dd-4ecf-9650-421165167b19');
update public.questions set subject = 'Microbiology' where id in ('7d46e0db-ce24-4633-9b13-e89273c26447','7fe515b3-b5e9-416e-92b8-c2b26a3e10d6');
update public.questions set subject = 'Applied Pharmacology' where id in ('7db01c7c-7cd5-41f5-902e-00e8f2612dfd','7e4b4c7d-94e0-4bcd-93b5-ac7f4180af6a','801524ce-9a5a-4b9f-84a8-c964c2b37a56');
update public.questions set subject = 'Applied Biochemistry' where id in ('7fc298fa-b92f-4d79-8d58-39a6c1f078fa');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('802c2a01-985d-43ce-9c6f-ba9f5a404c55');
