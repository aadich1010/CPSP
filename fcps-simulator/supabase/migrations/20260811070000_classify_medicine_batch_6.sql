-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 6 (100 questions): 88 reclassified, 12 left tagged 'Medicine' as
-- genuine clinical case-vignettes (diagnosis/management questions).
-- Running total: 600 of 1705 processed, 1149 remain tagged 'Medicine'.

update public.questions set subject = 'Clinical Anatomy' where id in (
'50d5805f-9f8f-447d-89a4-ad26a03bf169','5168b098-830b-4b39-a0ec-84d82d2b93ad','51891fcb-29ff-46aa-80da-8989f010579d','5347734e-ae91-43b5-8e93-4b440e0e6ff1','53c22d8a-f9cf-4019-be49-7b97500b230c','548128a3-c0b2-426c-a936-43d70b3867ed','55e57c05-a469-4b29-88cb-bce838e19e55','56219360-9c73-46a2-a206-b3293358910a','563b593a-db23-456c-a03f-c02eae4e4109','56e434e6-26af-49a7-9879-b94094ffb702','5798f572-4c65-4aea-b2f9-1e33710423f1','584a0206-32fe-473f-b792-7628fa531409','58cc0547-d42c-48a8-80ad-8eabd24bd72e','59fa28cb-48bc-4d16-bbb3-b055a5ad2c65','5b0f984f-2162-4e9b-8515-01fc78f4fe8a','5b3e72d4-157b-4c9f-b768-0bf794637fb4','5b6acd4a-1d72-4f9e-a8e9-fba3b4a5007f','5bc12058-87d3-4249-ac1a-3b47476d4a97','5bcb4e84-245b-439c-beda-d748ff917b18','5c80c0bf-e814-451c-b062-f7079c69a590','5d61e576-ded6-4d9b-b63c-50220acbde80'
);
update public.questions set subject = 'Applied Pathology' where id in (
'51242335-39bf-41fa-9345-a1df00ff8f21','5154b03a-b0dc-4bf6-8b07-2704ede8d57a','51a9418e-2d3d-4498-a8d9-ea4a836733e4','546d62ef-591d-4a3d-b1ff-9496d4fe38cc','57bc5ca1-742e-42a5-8005-315962054e8e','59834000-e7f8-4e0b-bc4c-ce840678944f','5a86db39-2f59-4dcb-a069-74eb9bc169ff','5c36fd32-d257-4b79-8f6f-d53d39852685','5c88ad70-1fc4-4e02-88a4-26b979001dfe'
);
update public.questions set subject = 'Applied Physiology' where id in (
'517a33c4-fdc0-406d-85fd-c2b3157b7b25','532c2f38-4b23-4b06-bc3f-e9b06337ce4a','540be8dd-9299-4cf9-a6fb-55e98644b592','548c996f-bd19-4c45-b67b-48fd23fb8cd0','54a8ca2e-69b4-4dca-b09b-d9896f0a5828','55e2a2af-ed5c-45ae-9720-4d9762b3b2c1','55fcff2e-bebf-4a4d-b378-7e336a26fbd2','57d1386d-a67e-4a1c-b90e-4f0db698fc1d','57d6c51e-2787-4a56-a0ef-fe98f93b3988','57fd953b-8fbc-4ddd-9217-5db2cd2c980d','58221181-0a45-4cb8-96e9-67250b4ff1f0','58aac137-786c-46a8-b75f-e376028d8328','58b74973-2051-45b6-9582-f60b36dfde31','58da559d-d5e5-487b-8857-0208d2e4ce97','5b45cfd0-caf0-4bfd-8525-1620fcc00ab3','5b88b652-63da-45c9-a5e2-5934aac1b7e1','5bec080e-77a0-4ed0-95ad-6c439b4c132e','5c6b59c4-5583-49ee-9c83-e80b3cbae5d4','5ce12480-263d-4af5-b586-427cf863b841','5d193642-7371-4001-a1fc-541c66a562dd','5d587863-088d-4ae3-bea6-13798a232fa1','5e1b92ee-e426-42bd-92fd-dca3372bee1f','5eaaf1cb-0b40-49f3-96bf-584e837109da'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'5261330e-cab8-4fc7-b6e2-d71cfd1c07e5','52bcdd04-3787-484a-8fe7-8f31b7618fe3','55282b0e-16c2-4a0d-8e51-7f3d286a2cf4','56d46969-5ed4-416a-8df2-a4934b1b5675','58d389c3-91bd-41b2-843a-499a6fdee769','59ee59aa-63c6-4295-8ded-6edbaf2d36b8','5a65ece9-b8d0-4501-9889-f312c4b3c2f2','5def4704-cbcf-4bff-b398-5c45a7308751','5f4b9662-72b6-4627-a037-d7eb1757ee70'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'5528e501-3f70-45ed-8334-ff2fa47b478d','556f9ad3-9211-4224-99ea-cb236e4d3024','5741886c-b3bd-4ddf-9a13-7fdfb6c78b25','5a80223a-0049-47c3-a157-0d2e9bfdc08c','58ae02f3-740c-4805-a5a6-65ef20b59044','5c52859a-72fd-42ea-b98d-ef528bef9d32','5cb8ea20-46d2-4b49-8b0b-280d0a665868','5e030801-04d0-447a-8643-dcb842999849'
);
update public.questions set subject = 'Microbiology' where id in (
'53a8c283-4c36-424f-b39f-bcc977a58c29','5719cd5d-80af-48f8-a43e-5861bbdb5316','58ebf960-bc7f-45a6-a895-8d030786f68c','5a3b0de9-d2be-4038-8a4d-64f86f3bf139','5a535943-b0c7-4b0f-a845-e4f135ce999d','5b229881-be78-4d89-83fa-1ee91832769b','5d1a0705-f6d3-4c34-a501-bd9bb696660d','5f517bfa-019a-4e93-b6eb-475338f7829b'
);
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('5193f82b-3ba2-4ddc-9835-31936984e34a','5f5a8018-b3b7-40af-b10b-254fa41af236');
update public.questions set subject = 'Ophthalmology' where id in ('567aa475-a5e5-4cbc-86af-109cd319d4fb');
update public.questions set subject = 'Anesthesia' where id in ('599bc2ba-82fb-4734-bae5-16f836addf3d','5b2c7164-7e16-4482-bdbe-f101b006fce5');
update public.questions set subject = 'Immunology' where id in ('5cc788ab-bd45-46b7-a3c2-d5c97de5b858');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('5c0d8c4e-c827-4ab8-94fa-c4f6ebda2db7');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('5cb6546a-26f4-4989-a343-da1d0f7d9719','5d8622fa-cb5b-4e3e-908e-46bdfb1fbabc','5f7f8912-50d9-4503-b1d1-6b9c67e6dd01');
