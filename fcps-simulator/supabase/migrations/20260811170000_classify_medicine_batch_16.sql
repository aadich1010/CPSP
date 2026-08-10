-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 16: fetched with an id-offset (63) instead of offset 0, since
-- kept-Medicine rows always sort before not-yet-processed rows -- this
-- skips repeats without re-fetching them. All 100 rows in this batch
-- were genuinely new; 92 reclassified, 8 left as 'Medicine' (6 genuine
-- clinical case-vignettes + 2 more corrupted/garbled source rows,
-- ids a24485ec-e184-45cb-9da7-f585daff02e0 and
-- a99155a4-96a9-4447-8d1a-50f6e489880d, flagged for admin review).
-- Running total: 1061 of 1705 processed (by DB count), 644 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Biochemistry' where id in (
'9ebf25cb-c9fe-4f48-bbaa-7f3cff8f3d05','a1b9d26e-5980-4700-93ea-9ed169c4d6d7','a1c6b8b1-a64b-4767-a067-f143f43f724f','a21c21f8-8992-4cc4-ae98-86ee95e839e3','a516ce69-340a-4106-a0e1-3e3eef0e4ee5','a5328cb2-4645-4ad6-961c-6f944de98b5d','a6160950-112c-4d1f-a6a4-12cc19e18e87','a92782df-0282-4838-b689-d3e3c2a81217','a944e697-5fa3-4fb4-b36c-52a2ccd17f62','aa6d0b46-0bf8-46a7-bfe3-d584808f59e9','ab14f9f5-5909-4b34-898b-c401948a5f98','acab9cfd-72ae-46a7-9f7e-ccf36cf202f4'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'9ed462db-096c-41d6-a735-47153ca87555','9f3f02ef-06a2-412f-a0bb-8f03a000ab68','9f6f2bdb-d430-4f59-b88e-39b37143dd0b','9fe9bf9a-2107-4e0e-a7b7-3b79f77cd787','a0b3028c-748d-48bf-87ee-870102e1ceef','a436af6e-5578-46af-abae-6258a888e75c','a43bffd5-b71a-4eb8-b331-51bd30b0aba5','a583d757-d986-478c-bd06-092cb684c35d','a70ebbc2-640d-48a3-a04e-6f4f566b30bb','a7b661a9-825d-4655-a2f9-62a648b89db6','a7b9d989-aec3-4dbb-a16d-04119b237066','a98b53d2-48b4-4969-b7d4-265c5253ad36','aa725ff6-6677-4782-b2af-d6fc8ac08765','aad39f23-5aed-4cc5-9fd1-0bb7aebb279c','aada3b15-6d9d-45a3-877d-85d77dc210e7','ab3ad783-8eeb-460d-8596-814c42198952','ab4dbf90-d6fa-46f3-8ae3-00acb38ddac0','abd3bace-2991-4321-954b-b904d487d17c','ac30b967-8bc8-4d3c-8eb3-a5d9f5ca984a'
);
update public.questions set subject = 'Applied Physiology' where id in (
'9f5a1cb9-85da-49ec-abde-9ab70a9003e2','a1cc0182-3f82-4fe0-94a6-336f7f393a01','a1d7fe85-109b-4159-b934-431ddf1da3e6','a25c0f39-aaff-4bbc-854c-0f786a82552c','a2d1c787-7444-4f9e-a673-90b43fc88876','a4d7b6a3-da99-4ff2-8163-d2682a296352','a5918b69-54a3-441a-b84c-67bf3593bc54','a5d768b3-eb1e-43f1-b887-b9054e5beef8','a5ea121a-b232-4cf1-9c8c-a98b542fc214','a78425ba-e121-499d-bee2-119af65c23bd','a8534d56-9bea-476e-b4b0-fbcad1a0dc6a','aa0a0354-e322-49fe-b7c7-a97c8627114a','aa58056f-6557-47a0-a8b9-e9bc3ae1f489','aaa447a2-9712-4a00-8af8-0e134bc685c3','ab26e232-1df3-4e48-b741-8c63517c3e95','ab4e24c5-8a1b-4c26-bfe5-9f531716eed4','abb580ca-1f8c-43e5-a6a1-6a9600311f59','ac568b17-24c2-470a-bd7f-f90d515eaa31','accec538-5bcd-496b-9dd0-7a7200e1bd21'
);
update public.questions set subject = 'Applied Pathology' where id in (
'9f602c89-d95a-4999-b6c9-953d97093690','9fd0bbe6-ddc1-4a31-ae71-ff3d85fffef2','a0ac10f4-ed06-4d6a-97da-4f115dcb4cbe','a0f9d425-c147-4020-9087-eca436d1e3af','a30d4d26-ae06-443c-b49c-8e6cfbe9e4fd','a43445e4-2da5-45aa-9cdf-32737085f360','a44d6828-16ed-45c0-96ed-47872f6f5d75','a6a34273-591c-44b6-9bfc-80b77d49e3a3','a72e3488-57af-4fb4-b1b7-9ef04df80a02','a8b66fe0-5d32-4cf0-89e9-f3c6df661701','a963126b-743f-4397-bb78-9c3044809df3','ab353afb-981f-49ee-ac09-09d0bbc97288','ab8424f8-0960-4486-a8be-d20d9aa7b707','ab917651-4be8-4ac7-bc05-ceb90063c4cb','abb3269d-addf-429c-98cd-349caf94266c','abca17a1-5a2a-4b52-a7f8-feb067cd2980'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'9f72eb87-2022-4ac2-a568-26f16a9db9b3','a0033e6b-1aba-452b-b0e8-8b85cdba3981','a095a55c-4daa-403a-9846-5db4ced3fd39','a1ed4f32-3db9-4379-85ca-f32205fb95a8','a2bafd85-e80b-45b9-9e31-883d1ab40984','a30406ce-5315-4625-9e2c-2f95a04cb124','a66c31ac-fdfe-4392-b367-7e4141a61325','a772687d-db41-4b1c-a648-5b53f5f6d0a0','a8b59dc6-83ff-48a4-8d65-02dabdff8712'
);
update public.questions set subject = 'Microbiology' where id in (
'9f8166ae-5c5f-4dd0-91fa-b3b64ad8fbe8','a3ea9a70-8a81-4746-b815-3f258096fb0e','a3ef83f3-b65f-496a-9e92-3e285f7b76d8','a42b08de-9328-4000-a7f8-4cbd46a3cb23','a65878eb-71cb-45d0-b3a7-057934ee7f28','a9619c8a-7d21-4270-af54-d9038636e11b','ab7edee3-2a1a-4203-8c6d-b11fcb83cca2','abea6315-4d6f-45df-9612-2b875edfdaa9'
);
update public.questions set subject = 'Immunology' where id in (
'9fda53d7-25f4-41bc-a0ff-1613cbd2c849','a054e9b7-d83c-4ee3-815e-3d713ee32575','a11a024f-3a3b-484f-8f7c-2e839c55deba','a1d89a9e-9dc5-4318-97e4-cabe4876d4c6','a2bca699-1f99-4ca1-a2a8-c0768161b02c','a6a0589d-b511-4d37-8a6a-1ee100152234','ac1378a8-a605-4cd7-a78e-605439c750fd'
);
update public.questions set subject = 'Pediatrics' where id in ('a39f3802-d78f-4b32-8bd3-b2c4b8aeb177','a86b78fb-75f9-4af7-b8c6-4823576570a2');
