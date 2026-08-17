-- "Chest Tummy Time" listed materials as "None", but the activity has the
-- parent reclined at 45° — they need something to recline against.
update activities
set materials = 'A reclined chair, couch, or pillows to prop yourself up'
where id = 'chest-tummy-time-m0_3';
