-- 퀴즈 보기: 오답끼리도 같은 뜻이 겹치지 않게 한다 (AC-04 "보기 중 중복되는 뜻이 없다")
-- 정답과 같은 뜻은 기존대로 제외하고, 같은 뜻의 단어가 여러 개면 하나만 후보로 둔다.
create or replace function public.get_quiz_choices(p_word_id uuid)
returns table (id uuid, meaning_ko text)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_word public.words;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  if p_word_id is null then
    raise exception '잘못된 요청입니다' using errcode = '22023';
  end if;

  select * into v_word from public.words w where w.id = p_word_id;
  if not found then
    raise exception '존재하지 않는 단어입니다' using errcode = 'P0002';
  end if;

  return query
    select c.id, c.meaning_ko
      from (
        select v_word.id, v_word.meaning_ko
        union all
        (select d.id, d.meaning_ko
           from (
             select distinct on (w.meaning_ko) w.id, w.meaning_ko, (w.pos = v_word.pos) as same_pos
               from public.words w
              where w.id <> v_word.id and w.meaning_ko <> v_word.meaning_ko
              order by w.meaning_ko, (w.pos = v_word.pos) desc, random()
           ) d
          order by d.same_pos desc, random()
          limit 3)
      ) as c(id, meaning_ko)
     order by random();
end;
$$;
