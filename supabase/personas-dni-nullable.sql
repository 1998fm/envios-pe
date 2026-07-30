-- Hacer dni nullable para permitir crear personas sin DNI
alter table personas alter column dni drop not null;
