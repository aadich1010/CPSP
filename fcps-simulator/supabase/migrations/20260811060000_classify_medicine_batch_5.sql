-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 5 (100 questions): 98 reclassified, 2 left tagged 'Medicine' as
-- genuine clinical vignettes.
-- Running total: 500 of 1705 processed, 1237 remain tagged 'Medicine'.

update public.questions set subject = 'Applied Pharmacology' where id in (
'3dcf9d6f-a099-4b1f-b061-57e742530a16','3ee99058-b59c-4121-b328-90a39330ab25','417dfc8c-bfa0-497e-9bdd-2baf14838df2','4310e5c0-7729-4600-9651-23737be3d724','4818a163-d6ab-4e30-9812-55762f8ebe6a','48e558ed-d05c-4250-bf03-1ca4166920af','4999a50a-ae36-4861-9001-12b36f75cf93','4a132a54-ef2b-43cb-bdf6-98fa7cb502ab','4d684064-04ac-413c-9e64-452b56625635'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'3e2dcbd4-a08e-4af1-981c-3664efafa9ad','3e3d7bc1-6473-4bdf-994d-051703479298','41004ecf-fec4-42f1-8e17-d00b8bdb5cb4','42503e89-8f8d-40e7-bcb4-3a01d69a0f21','435af40e-85b4-4b0e-96b7-9ea0bfe9de41','436a0d4f-74ba-4051-b0b5-b5b1112ada1e','4448f0eb-02ce-481f-9797-5b627b7ba54d','44927a44-17a3-4168-b971-eb4e6cb636fc','449e2b90-4789-42b9-a74d-1f2d358b4030','4556e210-fc56-4f63-beed-4dac1deca78e','45bab283-0bdf-483c-af31-ba71a3f4016e','462070b9-3cd8-452f-a4c0-d5f05d05ee9b','46f1a58a-1750-47f6-843a-6ebd66dc3f44','47893c7d-04c4-4423-8000-0758c40e6f45','481b01fa-022c-4961-b2fe-7c65a2f5a5e5','4a4f7633-6228-4f57-a493-c7314985c9cb','4a7fbd8b-538f-4758-b7a0-43335e7c3c0f','4aeaf6e0-e2b1-4c6e-90ad-923da7f9fa0b','4bb1c2dc-412b-4570-9ba4-03d3fa0bdcdd','4c99d7e3-55cf-4d27-9f5e-56a377ece302'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'3e3e0b3e-ba08-438b-ba38-74dec7d403e3','41473264-d2b0-47ec-9ab5-f55f06cff669','420d3d83-3b9c-408e-974f-dc3664287bc9','4ac3012b-678b-47ff-a27d-77756788af9f','4c1e5a2e-bf80-4289-a62b-13216202da09','4cc290b1-2818-4cd1-b11d-6c32e8c21557','4e49a082-dee4-403b-8c33-78cc39fd66e3'
);
update public.questions set subject = 'Applied Physiology' where id in (
'3e4e6751-80e3-4ab4-acae-2a7d6356fa30','3f34b48d-a3aa-4302-8f90-b93bad65757d','416bd066-dae1-4772-8963-fb9fa07bf1ac','418300d3-ede6-4636-ad74-3cbfeff6a7a6','41ab50bb-21df-43d5-a152-c51cab4396ba','42d77a7e-774a-43ac-82cc-03aee740d658','4430da9a-05e8-40ca-8619-fff8e67e850e','4488e3d8-0956-4ce1-a9b8-aab2bb3a89dd','45202015-1927-4425-a15c-90cc18356359','4536a869-eacf-4613-a514-e2d7265cce60','45c374ae-253d-4edd-a652-9879c88f3692','474a79c0-d52e-4d01-959e-2951267092f9','480fc1f3-c8ad-4de2-bf05-1809bfb8b585','48603e14-5565-4a4a-9cff-7a32c5eef047','49230371-3400-48ef-89d8-9c4dd6a8df3a','4927bf3b-318d-4a66-a2e2-86b21238f461','49b56e88-9b49-49c1-9017-b501166678fa','4a59b19d-381e-4748-9dd3-e68e1cfd7e8d','4bf2745c-42f6-4637-be4e-428c30cfee4d','4c48f71f-593b-4c5c-bf7d-61643204a61d','4cfc68d9-e742-4d3c-a804-e930a3032bd1','4dd85635-c2b5-4b2a-aa96-2c323d63b9fb','4dea2009-0b9c-4140-bbec-709b2dd861a2','4e71debc-ef28-4582-94e5-a81d3b22b0de'
);
update public.questions set subject = 'Applied Pathology' where id in (
'3ee6d68e-5045-4e18-9389-570ff9dc1e48','3fa6bc2f-0121-4c83-b759-8dd4a72df7b3','401f3d69-70f7-4938-8a0b-7e3a4eeb6ad9','40a43f1f-571f-43b9-8e7b-589731410b55','40d7dc8f-c7b5-4076-b032-bf5aa6965680','420f188c-30f8-4b2c-bc55-3433b3434875','43780246-0ced-4384-942e-e49f16df708a','4421ec82-a87a-4e16-bf5f-c322a1d502d4','46290907-427e-4060-971a-246353f506eb','4644d7ff-abf3-421a-be2a-e466ada0fe64','48771a6b-714b-443c-88fa-6c56137cdddd','49d300c3-f2b4-4459-a80f-1ac5faea483d','4ade9980-0f63-4542-a7e2-41565bbf246a','4ae6133c-0731-4762-a513-06771057f68b','4ca1574b-be63-4f17-b5a7-a7bb499fa29a','4cc29406-18aa-4fef-a073-8101561d917b','4df2e487-42ff-44d0-9cf5-1861c30fe69a'
);
update public.questions set subject = 'Immunology' where id in (
'408ea8a6-0e5c-4aac-8e50-e06c7f957217','43e1f33b-307f-4f21-8033-6092d4c96f4f','481a2ae6-f191-4bc6-8cae-60c275b3e5a4','4bfcb4dc-7bc2-4d53-ba32-e456de54f9e7','4ee09bda-e525-4542-98b1-b8467d4071c2'
);
update public.questions set subject = 'Microbiology' where id in (
'3f218c64-5181-43d6-8d7a-a6770844cc08','433407c4-5ac4-4fd6-8a43-982d44e06048','457d763d-b5d5-4990-a3c2-36eb74380763','484aed4d-c40d-4bd7-b082-95685a092498','48b601a0-7640-4305-bd20-976f4f1c223a'
);
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('400da312-0044-4c7d-bdf8-ff8a4f52a2c6');
update public.questions set subject = 'Pediatrics' where id in ('3f8069c2-45b7-4377-9bf9-e50eb5f40bb8');
update public.questions set subject = 'Community Medicine' where id in ('42ac89f0-8001-455e-86bf-8cf9136ffab1','4d51692c-c6bb-45c1-bbfb-0cc34f37ec70','4df8b4eb-6f1c-4b77-8c25-88bf3c45782e');
update public.questions set subject = 'Medical Ethics & Professionalism' where id in ('43ed7502-1c39-48d6-ac06-24111849cd92');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('44e90b26-5b8e-418e-b64b-0aa726707112');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('465c85d6-8a67-4345-bbb8-d5ff57b6e978');
update public.questions set subject = 'Ophthalmology' where id in ('466f90c6-29d1-4ef2-b82a-906241c5d188');
update public.questions set subject = 'Anesthesia' where id in ('4ecf3f49-dc85-4bdb-8f7d-529696919d14');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('4d0bbd0c-6ee1-4d63-ac79-56da34663896');
