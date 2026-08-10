-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 18: fetched with an id-offset (78) to skip repeats directly.
-- All 100 rows were genuinely new; 92 reclassified, 8 left as genuine
-- clinical case-vignettes.
-- Running total: 1246 of 1705 processed (by DB count), 459 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Community Medicine' where id in ('bc2f571b-f383-4535-b92f-dd83e024f18c');
update public.questions set subject = 'Clinical Anatomy' where id in (
'bc3a3dd1-9c2c-4c2a-a5d6-9c7b6ed7b6be','bcd37af5-f693-4ba0-b5fa-eea50fefd4b5','bd5a25d9-077c-4a8a-9426-169ca7c57dc0','bd6ff43d-1be0-4b54-b4dd-87f630a9dbc1','bdf30300-23ac-4294-8273-67030835dda0','beb466c2-0036-467c-bf5c-56b6cdf7bfe7','bf6b1a30-8d77-4111-a984-1c57cf23d447','bfd3d955-eafb-4602-b475-b4056bd1f3a3','c06936c9-9525-4b92-9244-b91e6ac71590','c097eb6e-1908-47b3-af8a-59085c8460e2','c0e373da-297f-48fb-bdc2-bd6583ee3225','c15cc23c-bc50-4056-8800-e6e402f46c10','c2c966e4-5455-4d1c-9d89-dc71d8e3515d','c2f02d77-d469-4d7f-b13a-3d97c1f3b522','c4c00838-7c74-4b1a-a31d-753935f4cf7b','c54cced3-8e26-4549-a636-6e5724075112'
);
update public.questions set subject = 'Applied Pathology' where id in (
'bc80e514-e05e-4c2e-951f-af2873af9901','bcd8c396-ee45-4d3f-973b-fd1423a9b211','bd379f2e-d9fb-4405-854e-5ba16b4ddba7','bd5963c4-ec39-4eb5-980e-25508ba46c4e','be70b6b0-4b57-4e62-85ad-1b03d528d2f0','be9cde25-bd13-46b1-9629-b766cd939c71','bf201917-a7d6-4110-9da3-cc98ba410516','bf649dac-852d-4b8d-b525-16cf7e9239b9','c0ed8d12-f046-4d24-a29a-b251a91d78ae','c10b827c-2bc2-4937-b469-d0445d62bd43','c39e0a2b-9df8-4d0b-95be-2571acbab6c9','c3cb4a07-f0b9-4317-b0d7-5b99b8a79545','c401b676-be65-4de7-8762-f7779926bfb4','c4e65a2d-db04-4613-8701-ffb809b3fc46','c4f9e796-802e-4605-aa23-99b85f6c7a03','c8743f0a-7b5c-4fc5-99c5-533efd274876','c881b7e0-fc74-48cc-9197-d4cd0d48b72c','c2a8745f-8816-4e41-85be-a76c482f9e9d','c2cf9b33-83ad-444f-9bb9-9c995dd68a57'
);
update public.questions set subject = 'Applied Physiology' where id in (
'bc8b2b46-c1bc-469b-af94-5fc984fdfb24','bd7fff33-674f-48aa-805c-b90e9caa1f86','bf98ad3b-898a-4a94-aa69-4cea1504d28f','bfae2416-f0bd-4f38-afe4-eac9e105b6bf','bfcf0e65-052c-4866-9963-082a99395764','c0a11a0a-3dd2-49ad-942b-ae65587aecba','c1741096-00ef-4369-b00b-39ddc270c2d5','c1a19f8b-8888-4c68-82d4-dfe86dc14c9f','c1dd858b-4d6d-45be-a2d1-3c2a654520f0','c21bc3ee-033b-41a8-9ab5-5c0693243cde','c233a3dc-b96f-4785-9545-f6a486004cf8','c2620793-bf03-40f8-8987-3be9ca86eae6','c382a3fe-8885-4922-af0f-512f2df04b2d','c60b67c0-616d-43f8-b8e6-61bc337b8138','c61dd43f-c661-4ef9-9786-56f5c9e82b3f','c6585cf8-25b0-4ab3-8f9f-038b747bfe9d','c69ab23a-aef6-4a0a-b5c5-01a3a74d3c10','c6d5ff1e-9801-40f3-a258-45bea38bdf85','c713a09d-bc9f-4036-913b-15d0d952a8b1','c7915bdc-3a15-4caa-844d-42344c369291','c8aa21b9-6156-4064-adb6-1536070de6fd','c045f0c0-ddee-4f76-96da-3e93491854b6','c6869bce-1b8d-45d9-84f6-df4674a176dc'
);
update public.questions set subject = 'Microbiology' where id in (
'bdc93c0e-897e-439e-b0d0-9dfa3b5d3dcf','be484d9d-9f40-464c-96b0-22f0bf56cc19','be519e22-457c-49f1-a69e-579f19e7b2f1','be85bc8b-50d5-4eb8-874c-70093fcb2eeb','be9871f4-4d81-47d5-8aab-f2dd1c49225f','bf6f27a7-6f5d-4939-96d2-1ccd55ac217a','c39c669e-b71a-4245-b453-4feb70da8491','c4e858f6-3918-4101-ad74-4ff962605f5b'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'be1765ed-4a7e-41dd-a5f1-a05f8ecf9e5d','bf0648da-c8ad-407c-8e44-0a057be276a9','c0336e12-2648-4989-9f5b-c5a2ac040170','c0829260-9c5f-4d81-baff-e918d2668346','c100fcbb-df61-4e8b-914c-474b77f7594b','c33650b9-23f8-40b6-8ccf-a807112fd93b','c545e17d-0de3-466f-9c74-06664dac0ac7','c68eb69a-6daa-4abf-9405-7b5ff7508ede','c8281254-b378-486f-9f4f-b9d9d4355c55'
);
update public.questions set subject = 'Immunology' where id in (
'be4b87ec-5541-4249-9c1a-1d2db378e254','c0deee3e-7228-4721-a07a-8d96e477e129','c1a95662-54d6-4916-8ef4-95d76812ed6f','c1bf7a60-b8a2-451a-a4b5-da665e143f33','c7132262-a260-457b-82dc-a613aecba817','c7d8f9d0-4626-40b0-9495-c457e592b0af','c867364c-dc35-494b-9a91-335145f77e11'
);
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('be4ee20a-f8a4-4ebd-b269-7b76a66f213e','c5bc2845-263c-4dd5-a401-14342d971dad');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('c1d75fa4-d582-4ac2-ae5f-584e11ae1325','c4a02a16-caf4-48b3-90bd-ffdb9907b3c2');
update public.questions set subject = 'Ophthalmology' where id in ('c4c88353-f46a-4b30-87f3-ef3ba2962dbc');
update public.questions set subject = 'Applied Pharmacology' where id in ('c24b749b-500c-44a9-b1a1-40fa8abadd33','c3bcfa13-d322-473a-9206-5187ca8dff1e','c5e2a05f-5ecb-4209-8f72-ab9168680d09');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('c89aac3c-9ee3-4e37-9e92-e12881df89b6');
