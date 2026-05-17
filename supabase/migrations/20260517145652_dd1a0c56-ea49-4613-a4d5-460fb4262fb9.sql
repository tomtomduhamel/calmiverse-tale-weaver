-- Insérer les 8 price_id Stripe Live dans stripe_price_mapping
INSERT INTO public.stripe_price_mapping (tier, is_annual, stripe_price_id, active) VALUES
('calmini', false, 'price_1TY5hRLKBARwZz5ACsNziawb', true),
('calmini', true, 'price_1TY5hQLKBARwZz5AIRLP4bm6', true),
('calmidium', false, 'price_1TY5hRLKBARwZz5AbBmWXAPt', true),
('calmidium', true, 'price_1TY5hQLKBARwZz5AiDwif4EO', true),
('calmix', false, 'price_1TY5hRLKBARwZz5Ai2SF2VH2', true),
('calmix', true, 'price_1TY5hQLKBARwZz5A8HXb0yI3', true),
('calmixxl', false, 'price_1TY5hRLKBARwZz5A4eR0y58T', true),
('calmixxl', true, 'price_1TY5hQLKBARwZz5APFVATss2', true);