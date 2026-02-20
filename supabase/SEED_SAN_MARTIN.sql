-- SEED INICIAL (opcional): Parqueadero S1-S4 - ejemplos de activos
-- Ajusta códigos/ubicaciones según tu plano real.

insert into public.assets (asset_type, code, name, location, zone, floor, criticality, status, ip_address)
values
('CAMARA','CAM-S1-ENT-01','Entrada vehicular S1 - Contexto','Acceso vehicular principal','PARQUEADERO','S1','ALTA','OPERATIVO',null),
('CAMARA','CAM-S1-ENT-02','Entrada vehicular S1 - LPR','Acceso vehicular principal','PARQUEADERO','S1','ALTA','OPERATIVO',null),
('CAMARA','CAM-S2-RAM-01','Rampa S2 - Norte','Rampa entre S1-S2','PARQUEADERO','S2','ALTA','OPERATIVO',null),
('CAMARA','CAM-S3-ASC-01','Acceso ascensor S3','Lobby ascensor','PARQUEADERO','S3','ALTA','OPERATIVO',null),
('CAMARA','CAM-S4-PAG-01','Caja de pago S4','Punto de pago','PARQUEADERO','S4','ALTA','OPERATIVO',null)
on conflict (code) do nothing;
