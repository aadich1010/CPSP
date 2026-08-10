-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 19: fetched with an id-offset (86) to skip repeats directly.
-- All 100 rows were genuinely new; 98 reclassified, 2 left as 'Medicine'
-- due to corrupted/mismatched source data (flagged for admin review):
--   d3fb41f9-5991-44e6-9645-f12a05bde717 (question stem asks about
--     Thymus blood supply but explanation describes the Thyroid gland)
--   d5d414d0-26ff-490f-a5a1-403439719140 (garbled merge of an unrelated
--     endoscope-sterilization stem with a separate beta-adrenergic stem)
-- Running total: 1344 of 1705 processed (by DB count), 361 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Physiology' where id in (
'c904ec6e-3c69-4167-a8cd-efd5bac6c32f','c931a257-2d41-4c93-9f5e-ad87574e0c18','c9902565-83be-4904-a9ed-cff96dfc185a','c9f1be70-15d5-4bfc-868c-35450913cd0e','ca02b208-548a-4ad7-94a0-63065dc0ce86','cb63d9e6-72e2-4156-a290-ce4a730801fc','cba25f1b-4c9a-4a98-8ed1-da254e27ca67','cc502974-08aa-4759-a6e1-cbf4dcf613c1','cd2ed1f6-7b7c-434c-9912-1b3d3d5f2967','cd8c6d52-fbdf-4802-8fa2-48c587b9c5a1','cdd88610-869d-4ed5-9621-1d48ebc28ea7','ce9be5a2-91eb-4929-a208-837f335c8f2f','cf87205d-e0fb-4aa7-8f75-80729eae743f','d0c22f5d-85d2-48a5-baba-2678d24eb3ab','d0e24ae3-a3c5-4bd2-9220-c37d113e1d9c','d1936fda-c484-49ea-83b6-605f904e49d7','d1f60bcf-1a66-45fe-a4ca-7dbe774bebb1','d2162e73-1218-4d4c-ad89-8a114dd2fabd','d227fb7c-2043-46d5-8382-7add16d82c24','d228cc36-0ade-4f48-9cb7-95fb0f03be70','d29d512c-3ab3-4a0c-83c9-5cba8e2757e6','d2c4a08b-28db-4fa6-bc57-de04cf600140','d30d40a5-a165-4d92-af8e-724f6c5d3442','d386fc6d-d856-4621-99f3-da9aa363087a','d400c510-0ba7-4ec0-a148-b0b2762bcac2','d478676f-de7e-4f83-a50f-f3e03f2c784d','d4b9ba64-2e19-47fb-9614-9898763d7ff5','d4dfec0b-8287-4563-bff0-f2a77bfe91b8','d676b116-dfe7-45f8-a6b1-7c29ba2c1821'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'c93304d4-26bb-49b6-bd2c-44673cac8936','c9939b7c-e9af-441f-b495-8f47e9c27ca0','c9a7afc1-e669-4569-b88e-ee76ee8bc8ed','cbb2786b-d3e4-4bb9-a1af-249e0e76aaf1','cc32c5d2-afd5-47d1-89a0-6e78e8f5513d','cca7f63a-cc2f-425d-b5b7-c17bbf373e6e','cd93f313-6938-4801-b8a8-d4ac10b0ea47','ce51d1b4-a932-4116-ac81-2434c79b75ca','ce69a86e-4e2b-4386-8a46-d93498bc3b0a','d05ffbe2-03f0-4184-aa2f-4915dcde2892','d06a4567-9087-4fa7-b818-b71f04f41132','d1eeead2-5c59-488c-93a1-4cca53b1ba65','d213c9ae-22e4-4d76-88a5-397271da9335','d29339fd-3daa-4264-888e-064eef1a9de7','d2ba5734-900d-4db2-a2a5-d8cd114e10d2','d3111455-ea92-4697-959e-0b27e1cdca91','d352ead0-1a2d-4d80-b0dc-75407125d486','d444efa4-ed42-4b44-a201-d293bc27b0a9','d44e3898-f84b-496d-a285-ca0168353095','d54f2e68-0e5d-4c1c-a351-42b2f3b88ac3','d59dd23f-c7aa-45c7-ae95-231988eb67a0','d6fd958c-0591-46c2-a52b-a8d06e06e9d9','d2d147ce-7332-4b03-aa61-93a2118c3064'
);
update public.questions set subject = 'Applied Pathology' where id in (
'c9c8dc2d-da09-4b99-9b43-4706477dccd5','ca19dd8f-c27c-40f6-b4f3-577c6c620431','ca48ec5c-9d2e-4d9f-9da6-28d05d8e2cbe','cb380edb-188e-4e09-a555-366c904c3ab9','cb95b524-39b5-4c34-9eeb-237ec4ad6194','cc96ae81-22e6-46bb-9a5a-5f8a1d48f6de','cce8ad56-274e-4832-bc9c-d4c4dead3a8e','ce794d75-9c86-4629-8169-820d3171abf4','cdedd225-d27a-4e3f-b824-aa73d7719038','d0b26b2c-1a37-42ad-a19e-e2bbe3880e79','d0cd0a33-3535-4510-ae0c-ad37053af10d','d157917c-a7e4-4d17-bee0-a6180c1a5d85','d23f860a-a6c8-465e-8e11-956cd73b32fb','d2c69531-dec2-4a65-bd13-3d6287a847f8','d2d58308-2054-4d45-8d3c-8ce31c7f5701','d37b63bd-d838-4c04-9343-11f25e465c5b','d38e424b-45be-4fe9-a015-5c735a16ac94','d47d2b62-00e1-4176-9838-5bfb0f298d55','d47d87ee-570a-4ada-b3ac-8f9e95771dda','d4e77378-d58c-4831-865a-3c54cd5dcc03','d58e34bd-0884-416f-b8cc-6c9d4ffa9b84','d62c4fae-8359-415f-a887-e0a5c0b86bbd','d66ab1a5-bf90-4304-9c0d-6ab2bfc55150','d66559f4-c1aa-4f97-8c88-9bbcd992c258'
);
update public.questions set subject = 'Applied Biochemistry' where id in ('cce69a5e-5395-404d-b3f9-a258f2272da9','ce3a59d0-d1ed-4474-8bed-7bc90bed2047');
update public.questions set subject = 'Applied Pharmacology' where id in ('c99047e8-33ab-4f59-bfcd-af075aedfa00','cb9f2726-dd12-4462-9007-235d41ac00fc','d11a586b-ff4e-4e94-a358-dfbb5dd1ee02','d2280467-646f-4ab0-a731-b68bc87153ea');
update public.questions set subject = 'Immunology' where id in ('cdd67e2a-e658-4b03-bb4b-e857e0930523','d53e44cd-6059-4191-b60d-3b5e9eaac3fb','d576eaaa-1218-4e9a-8250-b0350318d287','d62be4e3-9950-408d-9cfc-edc8b9c816c1');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('cd09d30d-bbb8-4ac1-bdb4-20a110a66029','d14599a4-3ae5-4905-ab04-ce818849fb35');
update public.questions set subject = 'Anesthesia' where id in ('cf772ded-cfc8-4708-b19e-737135d2c7d2');
update public.questions set subject = 'Behavioral Sciences' where id in ('d1007d8f-c76a-4973-a05c-0977dec123f3');
update public.questions set subject = 'Microbiology' where id in ('d1ae791b-e02b-419f-9134-a2bf00d9c7d8','d4d732d0-fc87-42af-8c65-e90766f73b24');
update public.questions set subject = 'ENT' where id in ('d287f0c1-ea53-4482-8b2f-7bb0a5c836f2');
update public.questions set subject = 'Emergency Medicine / Critical Care Basics' where id in ('d1b36033-4689-46b3-9aac-ad3bed234742','d20da419-9327-424b-be23-59a24dee4d31');
update public.questions set subject = 'Pediatrics' where id in ('c973627e-23b5-4054-82fe-3226d533b7f7');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('d4adde00-265a-44c5-a7ac-349724ff8254','d65334e1-6363-4b60-bcae-69c2a84c8804');
