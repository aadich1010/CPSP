-- ═══════════════════════════════════════════════════════════════════════════
-- Pilot batch: the first 100 (of 1705) 'Medicine'-tagged questions, read and
-- classified by hand against their actual question_text + explanation, not
-- by keyword matching. No automated classification -- human or AI -- can be
-- claimed 100% accurate for medical content; this is a careful first pass,
-- with genuinely ambiguous/clinical-vignette questions deliberately left
-- untouched rather than force-assigned. See chat for the full per-question
-- breakdown and methodology.
--
-- Of the 100: 94 were confidently basic-science recall questions and moved
-- to their applied bucket (or an existing card, where the content actually
-- fit Immunology/Microbiology/Radiology better than any 'Applied X' split).
-- 6 stayed as 'Medicine': 5 were genuine clinical case-vignettes (testing
-- diagnosis/management, not basic-science recall) and 1 straddled two
-- categories ambiguously.
-- ═══════════════════════════════════════════════════════════════════════════

update public.questions set subject = 'Applied Physiology' where id in (
  '00709451-6403-45cd-8074-2c4566faec6d','00745db4-fd55-43c9-999f-b8e4ed6b147b',
  '019cdae9-c2c2-4341-ad7f-2668e045c7de','029f821e-3c1e-4217-8c61-d3076dfc0a0a',
  '02ad810c-ef92-43a2-8e01-47a8a0f12eed','03513b88-210b-4d5a-81dd-a11efcafabf2',
  '05b2ae9e-2867-49e4-8859-9a25e1330deb','05d50970-6aea-4169-a853-4ef49414a5aa',
  '06c69dff-c93f-4f9d-a3b9-b70026d84929','072ae2dd-fa03-4ab7-91b4-78a92b51ef8f',
  '07397983-55d7-43eb-8f07-2227c353ab0e','075caa84-2c06-4187-8ae6-c9cdaeed39a3',
  '076bcfde-8bb3-4240-be78-fabbe5a42501','0778f042-4644-4a2c-9237-a10deb82937b',
  '07a3c752-0276-4183-b00c-c90e5bc8e91e','07d33608-7c67-49cd-999e-622af22b9fba',
  '082591c5-200e-4e58-9156-8a53591c20d5','08b93c4a-afdd-4256-b0db-0db15366b451',
  '08f2d912-fb98-4255-aca0-440c0239ffe9','08f896bd-c2ad-45ff-8cdf-312e2532e2ac',
  '0903a557-3bb1-4e89-8b60-667acac271a5','090ad678-1eef-4e34-9f82-7d96c2d0bc7a',
  '09fa560d-35ef-491a-90b8-7559b81a1eef','0a2131b5-1810-4552-a9af-84a6a5ca9ec3',
  '0a8313c9-576e-4578-bbdc-a8f33ada9c01','0ac2d4a6-48bc-4005-9e45-cd6c5c17a827',
  '0acd874e-4e21-4f7a-ac6e-45e55e58ecc8','0bb3224c-874b-436f-acb0-6059576cad3c',
  '0bbf9655-d689-4bdc-b5f1-0ce265eaff53','0cae0843-3a15-45ad-9843-d4376ce4b0a8',
  '0dcb3dd3-4331-4ddd-888c-7a63254fe211'
);

update public.questions set subject = 'Applied Pathology' where id in (
  '0139f60d-d8fa-4c37-bade-5a8c7ea62b23','01c0d5e8-9a15-4bfc-84c1-39bb01b81d9a',
  '03178f13-dedf-4ed2-a91c-2d53ccaa5cf0','03a271bc-29ae-41fa-828d-719411026024',
  '03b66e93-e00d-419d-97a7-e09615306e51','05c3e7f6-ff1e-46c2-b9fa-6e3f20e6f0de',
  '069dba0b-8b3c-4f8c-9080-68f2b6371856','06d95d82-d61c-49e8-9ed4-acd014d68d35',
  '06db1915-5c30-47d1-bed9-06d53e886ce8','06e5cdf6-2534-497b-afac-aadcb4620938',
  '07174cb6-2cca-41d2-9ed5-d07351981ddd','07423f69-6eca-4bbb-ac09-60b6a718c868',
  '0869ba09-6ace-4685-a569-649b526511b2','0908199a-1262-4b44-bbb5-7af3f18bb6a1',
  '0977fc9b-f0c5-4888-83e6-bfcb7fb8b6e6','098a7f23-8d71-4a12-a133-a3656fa40805',
  '099cfd60-d55c-45b9-8c7a-fa72a7c87d38','09e4a23f-8dde-462a-a841-5ecf035aab8f',
  '0a519682-37c8-4e3c-8f4c-5ac8f03c24af','0c051f19-05de-471b-8d56-9525d4ca48af',
  '0cb6688e-1a7a-493d-9552-c18b39c8d2df','0d18562b-b776-4924-86cb-b229bbc0e485'
);

update public.questions set subject = 'Clinical Anatomy' where id in (
  '00cc587b-0433-4843-8e74-5650f9a90c97','030c7a52-5686-4cd0-a555-4df4d178f9bf',
  '0329f3aa-285f-4ff4-a75e-2d259cab6f60','03d9c700-fa8d-4e41-925a-95c96ff3063e',
  '03ed98d8-f4cd-433a-94fc-7b6839521037','0455da90-fc2e-4625-bf5a-14506ae55ad2',
  '046e0ecd-f041-4a3f-a19e-640fdd765aca','0498e330-f3af-4cdb-b6c4-c430725cc636',
  '0579982b-8bc5-4863-ba36-4d1b0e63effd','079b7397-e2f8-4f16-aa5f-49bd83448154',
  '07b0ee14-b909-493b-b98f-0fc296bb3205','07bf34ba-e92d-4b50-b5d6-0c17c7ced120',
  '07c30554-a30e-46af-8d14-5e1ed8d2f965','081ecd96-26f5-45eb-94f9-27a5d6157ca0',
  '0927a96a-e36d-47d2-8aac-86bbc289ea75','09e4edae-062f-4e83-a4ca-2f342d8ddb60',
  '0a908608-460f-4031-9c19-4381e1b4f938','0ae4713e-7225-4d73-a688-558921f0d063',
  '0b18bb92-0d35-471f-8bf1-3666df969ce2'
);

update public.questions set subject = 'Applied Pharmacology' where id in (
  '03215d24-dc2d-4937-ba98-0eb37ff5f4be','0322f952-ba6d-40a9-b2d6-0bd91b19e5bf',
  '035ef912-6c43-477d-9537-a9d5b21e78da','04906b93-d3be-4d69-92ca-cc8a9aeaf978',
  '0ce84bc2-6b40-4639-a47c-7ec90850f8b6'
);

update public.questions set subject = 'Applied Biochemistry' where id in (
  '02c97812-427a-495b-a280-12f273746c5a','040d42d4-1afe-4836-9925-e296903b9010',
  '05371a78-1e19-44e7-bbf7-2676457e5745','084bb8c1-1a46-4bec-a482-8d380de0a5f7',
  '08e0faf1-f7a7-48bd-b2f8-a7c1fd294220','0d2e9637-8f22-41f9-968e-944d09c185be'
);

update public.questions set subject = 'Immunology' where id in (
  '0409f29a-4217-4e5d-b011-550df1acf534','070c77a2-867e-4b92-9cd9-200b9ef79994',
  '075ea334-098e-469a-aa68-fbb703beb015','07a70438-f0f8-4f2a-8f6f-088773c4b045',
  '0c7bb37d-89d5-4c23-955e-970a13e1d75a','0d689803-3a8e-4114-94ec-5f2939b21c02'
);

update public.questions set subject = 'Microbiology' where id in (
  '075a6745-2695-4d4a-90c4-a916c8e2bcdf','07fbb200-53f0-4f22-b5e1-ada4f7607642',
  '08588806-a3e1-43ab-bd93-8c5015ad4d49','0b841d11-0842-484c-8d7c-30cf16f9e78d'
);

update public.questions set subject = 'Radiology (Imaging Basics)' where id in (
  '0d84c7d6-da8e-4430-827d-258881eed16a'
);

-- The remaining 6 of the 100 (5 clinical case-vignettes + 1 genuinely
-- ambiguous) are intentionally NOT updated -- they stay tagged 'Medicine'.
