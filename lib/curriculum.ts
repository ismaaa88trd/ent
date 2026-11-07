/**
 * Учебная программа «ЕНТ: Маршрут» — математика + информатика.
 *
 * Источники структуры:
 *  — Bilimqor (ent/math: 145 тегов, ent/inf: 32 тега) — только как внешний тренажёр:
 *    здесь хранятся ссылки на разделы, а не вопросы, решения или тексты уроков;
 *  — официальные спецификации НЦТ (для использования с 2026 года).
 *
 * Группировка тегов в учебные темы, зависимости и число сессий — оценка автора плана,
 * а не данные Bilimqor или НЦТ. Перед финальной версией плана сверь темы со спецификацией.
 * Чтобы импортировать темы из другого файла, достаточно заменить массивы `modules` и `topics`.
 */
import type { StudyModule, Subject, Priority, Topic } from "@/lib/types"

export const MATH_SPEC_URL = "https://testcenter.kz/upload/iblock/577/05_.pdf"
export const INFO_SPEC_URL = "https://testcenter.kz/upload/iblock/994/15_.pdf"

const practice = (name: string, subj: "math" | "inf" = "math") =>
  `https://bilimqor.kz/practice?subject=${subj}&topic=${encodeURIComponent(name)}&go=1`
const tag = (slug: string, subj: "math" | "inf" = "math") => `https://bilimqor.kz/ent/${subj}/tema/${slug}`
const mathPractice = (name: string) => practice(name, "math")
const infPractice = (name: string) => practice(name, "inf")
const mathAll = "https://bilimqor.kz/practice?subject=math&topic=__all__&go=1"
const infAll = "https://bilimqor.kz/practice?subject=inf&topic=__all__&go=1"

export const subjects: Array<{ id: Subject; label: string; shortLabel: string }> = [
  { id: "algebra", label: "Алгебра и начала анализа", shortLabel: "Алгебра" },
  { id: "geometry", label: "Геометрия", shortLabel: "Геометрия" },
  { id: "informatics", label: "Информатика", shortLabel: "Информатика" },
]

export const modules: StudyModule[] = [
  { id: "a1", subject: "algebra", order: 1, title: "Фундамент: числа, дроби, проценты", description: "База после перерыва: дроби, проценты, пропорции и текстовые задачи." },
  { id: "a2", subject: "algebra", order: 2, title: "Степени, корни, формулы сокращённого умножения", description: "Преобразование выражений — основа всех следующих тем." },
  { id: "a3", subject: "algebra", order: 3, title: "Уравнения и системы", description: "Квадратные, с модулем, иррациональные уравнения и системы." },
  { id: "a4", subject: "algebra", order: 4, title: "Неравенства, ОДЗ и интервалы", description: "Метод интервалов, ОДЗ и отбор корней." },
  { id: "a5", subject: "algebra", order: 5, title: "Функции и графики", description: "Область определения, свойства, графики и обратные функции." },
  { id: "a6", subject: "algebra", order: 6, title: "Показательные и логарифмические темы", description: "Функции, уравнения и неравенства — самый объёмный модуль." },
  { id: "a7", subject: "algebra", order: 7, title: "Тригонометрия", description: "Круг, формулы, уравнения и отбор корней." },
  { id: "a8", subject: "algebra", order: 8, title: "Последовательности и прогрессии", description: "Арифметическая и геометрическая прогрессии." },
  { id: "a9", subject: "algebra", order: 9, title: "Производная и анализ функций", description: "Касательная, экстремумы, наибольшие и наименьшие значения." },
  { id: "a10", subject: "algebra", order: 10, title: "Первообразная и интеграл", description: "Первообразные, определённый интеграл и площади." },
  { id: "a11", subject: "algebra", order: 11, title: "Финал: смешанная практика по математике", description: "Многошаговые задачи ЕНТ и разбор вариантов." },
  { id: "g1", subject: "geometry", order: 1, title: "Планиметрия", description: "Треугольники, четырёхугольники, окружности и площади." },
  { id: "g2", subject: "geometry", order: 2, title: "Координатная геометрия", description: "Отрезок, прямая и окружность на плоскости." },
  { id: "g3", subject: "geometry", order: 3, title: "Векторы", description: "Координаты, скалярное произведение, векторы в пространстве." },
  { id: "g4", subject: "geometry", order: 4, title: "Стереометрия", description: "Призмы, пирамиды, тела вращения, углы и расстояния." },
  { id: "i1", subject: "informatics", order: 1, title: "Информация, системы счисления, логика", description: "Быстрые баллы без алгебры: перевод чисел, объём информации, таблицы истинности.", specSection: "Информационные процессы" },
  { id: "i2", subject: "informatics", order: 2, title: "Алгоритмы и Python", description: "Трассировка кода: условия, циклы, строки, функции.", specSection: "Компьютерное мышление" },
  { id: "i3", subject: "informatics", order: 3, title: "Данные: базы данных, SQL, таблицы", description: "SELECT, LIKE, ключи и формулы электронных таблиц." },
  { id: "i4", subject: "informatics", order: 4, title: "Компьютерные системы и сети", description: "Устройство компьютера, ПО, сети и IP-адресация.", specSection: "Компьютерные системы" },
  { id: "i5", subject: "informatics", order: 5, title: "Web: HTML и CSS", description: "Теги, ссылки, таблицы и базовые стили." },
  { id: "i6", subject: "informatics", order: 6, title: "Безопасность и финал", description: "Информационная безопасность и смешанные задачи ЕНТ." },
]

type Row = [
  id: string,
  title: string,
  description: string,
  sessions: number,
  minutes: number,
  tasks: number,
  priority: Priority,
  prerequisites: string[],
  url: string,
  sessionTitles?: string[],
]

const rows: Row[] = [
  // ───── Алгебра ─────
  ["a1-fractions", "Дроби и сокращение дробей", "Обыкновенные, десятичные и периодические дроби, сокращение, стандартный вид числа.", 2, 40, 18, "foundation", [], tag("sokraschenie-drobey")],
  ["a2-powers", "Степени и корни: правила", "Свойства степеней и корней, действия с корнями.", 2, 45, 16, "foundation", ["a1-fractions"], tag("stepeni-i-pokazateli")],
  ["a2-fractional", "Степени с дробными показателями", "Переход между корнями и дробными степенями.", 1, 45, 10, "foundation", ["a2-powers"], tag("stepeni-s-drobnymi-pokazatelyami")],
  ["a2-fsu", "Формулы сокращённого умножения", "Квадрат суммы и разности, разность квадратов, кубы.", 2, 45, 16, "foundation", ["a2-powers"], tag("formuly-sokraschyonnogo-umnozheniya")],
  ["a2-poly", "Многочлены: приведение и разложение", "Приведение подобных, вынесение множителя, разложение на множители.", 2, 45, 14, "foundation", ["a2-fsu"], tag("privedenie-mnogochlena")],
  ["a2-algfr", "Алгебраические дроби", "Сокращение и упрощение рациональных выражений.", 2, 45, 16, "foundation", ["a2-poly", "a1-fractions"], mathPractice("Тождественные преобразования")],
  ["a2-irr", "Иррациональные выражения", "Преобразование выражений с корнями и сумма радикалов.", 1, 45, 10, "high", ["a2-powers", "a2-fsu"], tag("preobrazovanie-irratsionalnykh-vyrazheniy")],
  ["a1-percent", "Проценты и пропорции", "Проценты, части, пропорции и арифметические вычисления.", 2, 40, 16, "foundation", ["a1-fractions"], tag("arifmetika")],
  ["a1-word", "Текстовые задачи и тарифы", "Движение, работа, смеси и задачи с тарифами (аренда, цена).", 3, 45, 18, "high", ["a1-percent"], mathPractice("Текстовые Задачи")],
  ["a1-number", "Делимость и теория чисел", "НОД, НОК, признаки делимости — можно отложить.", 1, 40, 8, "normal", ["a1-fractions"], tag("teoriya-chisel")],

  ["a3-quad", "Квадратные уравнения", "Дискриминант, неполные уравнения, разложение и проверка корней.", 3, 45, 22, "foundation", ["a2-poly"], mathPractice("Корни квадратного уравнения"), ["Дискриминант и формула корней", "Неполные уравнения и разложение", "Смешанная практика ЕНТ"]],
  ["a3-vieta", "Теорема Виета и симметричные выражения", "Сумма и произведение корней, сумма квадратов корней.", 1, 45, 10, "high", ["a3-quad"], tag("teorema-vieta")],
  ["a3-biquad", "Биквадратные и степенные уравнения", "Замена переменной и степенные уравнения.", 1, 45, 10, "high", ["a3-quad", "a2-fractional"], tag("bikvadratnoe-uravnenie")],
  ["a3-modul", "Уравнения с модулем", "Определение модуля, раскрытие и случаи.", 2, 45, 14, "high", ["a3-quad"], mathPractice("Уравнения с модулем")],
  ["a3-irr", "Иррациональные уравнения", "Возведение в степень и проверка посторонних корней.", 2, 45, 14, "high", ["a3-quad", "a2-irr"], mathPractice("Иррациональные уравнения")],
  ["a3-systems", "Системы уравнений", "Подстановка, сложение, нелинейные системы.", 2, 45, 16, "high", ["a3-quad"], mathPractice("Системы уравнений")],

  ["a4-intervals", "Числовые промежутки и линейные неравенства", "Запись промежутков, пересечение и объединение.", 1, 40, 10, "foundation", ["a1-fractions"], mathPractice("Числовые промежутки")],
  ["a4-odz", "ОДЗ и отбор корней", "Знаменатель, корень и логарифм — что нужно исключить.", 2, 45, 14, "high", ["a2-algfr", "a4-intervals"], mathPractice("Уравнения")],
  ["a4-quad", "Квадратные неравенства и метод интервалов", "Знаки на промежутках, решение неравенств второй степени.", 2, 45, 14, "high", ["a3-quad", "a4-intervals"], mathPractice("Неравенства")],
  ["a4-fractional", "Дробно-рациональные неравенства", "Метод интервалов для дробей и учёт ОДЗ.", 2, 45, 16, "high", ["a4-quad", "a2-algfr"], mathPractice("Дробно-рациональные неравенства")],
  ["a4-irr", "Иррациональные неравенства", "Равносильные переходы с корнями.", 1, 45, 8, "normal", ["a4-fractional", "a3-irr"], tag("irratsionalnye-neravenstva")],
  ["a4-systems", "Системы неравенств и неравенства с модулем", "Пересечение решений и модуль в неравенствах.", 1, 45, 10, "normal", ["a4-quad", "a3-modul"], tag("sistemy-neravenstv")],

  ["a5-domain", "Область определения функции", "Нахождение области определения по формуле и графику.", 1, 45, 12, "high", ["a4-odz"], mathPractice("Область определения функции")],
  ["a5-lin", "Линейная и квадратичная функции", "Прямая, парабола, вершина, нули и промежутки знакопостоянства.", 2, 45, 16, "high", ["a3-quad"], mathPractice("Функции")],
  ["a5-graphs", "Свойства функций и чтение графиков", "Монотонность, чётность, преобразования графиков.", 2, 45, 14, "high", ["a5-lin"], tag("grafiki")],
  ["a5-inverse", "Обратные функции и композиция", "Нахождение обратной функции и композиция функций.", 2, 45, 12, "high", ["a5-graphs"], mathPractice("Композиция обратных функций")],

  ["a6-expfunc", "Показательная функция и её свойства", "График, возрастание и убывание, область значений.", 1, 45, 10, "high", ["a5-graphs", "a2-fractional"], tag("svoystva-pokazatelnoy-funktsii")],
  ["a6-expeq", "Показательные уравнения", "Приведение к одному основанию и замена переменной.", 2, 45, 16, "high", ["a6-expfunc", "a3-quad"], mathPractice("Показательные уравнения")],
  ["a6-expineq", "Показательные неравенства и системы", "Знак неравенства и основание больше или меньше единицы.", 2, 45, 14, "high", ["a6-expeq", "a4-quad"], tag("pokazatelnye-neravenstva")],
  ["a6-logdef", "Логарифм: определение и вычисление", "Что такое логарифм, десятичный и натуральный логарифмы.", 2, 45, 14, "high", ["a6-expfunc"], mathPractice("Логарифмы"), ["Что такое логарифм", "Вычисление логарифмов"]],
  ["a6-logprops", "Свойства логарифмов и замена основания", "Произведение, частное, степень и формула перехода.", 2, 45, 16, "high", ["a6-logdef"], mathPractice("Свойства логарифмов")],
  ["a6-logfunc", "Логарифмическая функция", "График и свойства логарифмической функции.", 1, 45, 8, "high", ["a6-logprops"], tag("svoystva-logarifmicheskoy-funktsii")],
  ["a6-logeq", "Логарифмические уравнения", "ОДЗ, потенцирование, замена переменной.", 3, 45, 20, "high", ["a6-logprops", "a5-domain"], mathPractice("Логарифмические уравнения"), ["ОДЗ и простейшие уравнения", "Уравнения с заменой", "Смешанная практика ЕНТ"]],
  ["a6-logineq", "Логарифмические неравенства", "Основание, ОДЗ и знак неравенства.", 3, 45, 20, "high", ["a6-logeq", "a4-fractional"], mathPractice("Логарифмические неравенства"), ["Простейшие неравенства", "Неравенства с ОДЗ", "Смешанная практика ЕНТ"]],
  ["a6-logparam", "Выражение логарифма через параметры", "Выразить логарифм через заданные логарифмы.", 1, 45, 8, "normal", ["a6-logprops"], tag("logarifmy-vyrazhenie-cherez-parametry")],

  ["a7-angles", "Углы, радианы и тригонометрический круг", "Градусы и радианы, четверти круга.", 1, 40, 10, "foundation", ["a1-fractions"], tag("ugly-gradusy-i-radiany")],
  ["a7-values", "Значения тригонометрических функций", "Табличные значения sin, cos, tg, ctg.", 1, 45, 10, "high", ["a7-angles"], mathPractice("Значения тригонометрических функций")],
  ["a7-ident", "Тригонометрические тождества и формулы приведения", "Основное тождество и формулы приведения.", 2, 45, 14, "high", ["a7-values", "a2-fsu"], tag("trigonometricheskie-tozhdestva")],
  ["a7-double", "Формулы двойного угла, суммы и произведения", "Преобразование тригонометрических выражений.", 2, 45, 14, "high", ["a7-ident"], mathPractice("Преобразование тригонометрии")],
  ["a7-eqbasic", "Простейшие тригонометрические уравнения", "sin x = a, cos x = a, tg x = a.", 2, 45, 14, "high", ["a7-values", "a3-quad"], mathPractice("Тригонометрические уравнения")],
  ["a7-eqadv", "Тригонометрические уравнения: методы и отбор корней", "Замена, разложение, однородные уравнения, отбор на промежутке.", 3, 45, 18, "high", ["a7-eqbasic", "a7-double"], mathPractice("Тригонометрические уравнения")],
  ["a7-ineq", "Тригонометрические неравенства", "Решение по единичному кругу.", 1, 45, 6, "normal", ["a7-eqbasic", "a4-quad"], tag("trigonometricheskoe-neravenstvo")],
  ["a7-inverse", "Обратные тригонометрические функции", "arcsin, arccos, arctg и их значения.", 1, 45, 8, "normal", ["a7-eqbasic", "a5-inverse"], mathPractice("Обратные тригонометрические функции")],
  ["a7-extreme", "Наибольшие и наименьшие значения тригонометрических выражений", "Оценка выражений через ограниченность sin и cos.", 1, 45, 6, "normal", ["a7-double"], tag("naibolshee-znachenie-trigonometricheskogo-vyrazheniya")],

  ["a8-seq", "Последовательности", "Формула общего члена, рекуррентные задания.", 1, 40, 8, "normal", ["a5-lin"], mathPractice("Последовательности")],
  ["a8-arith", "Арифметическая прогрессия", "n-й член, сумма n членов, свойства.", 2, 45, 14, "high", ["a8-seq"], tag("arifmeticheskaya-progressiya")],
  ["a8-geom", "Геометрическая прогрессия", "n-й член, сумма, свойства и задачи по формуле.", 2, 45, 14, "high", ["a8-seq", "a2-powers"], mathPractice("Геометрическая прогрессия")],
  ["a8-inf", "Бесконечно убывающая прогрессия", "Сумма бесконечно убывающей прогрессии.", 1, 45, 10, "high", ["a8-geom"], tag("beskonechno-ubyvayuschaya-geometricheskaya-progressiya")],

  ["a9-def", "Производная: определение и таблица", "Правила для степени, суммы и таблица производных.", 2, 45, 14, "high", ["a5-graphs", "a2-fractional"], mathPractice("Производная")],
  ["a9-rules", "Правила: произведение, частное, сложная функция", "Производная произведения, частного и сложной функции.", 2, 45, 14, "high", ["a9-def"], tag("proizvodnaya-slozhnoy-funktsii")],
  ["a9-tangent", "Касательная к графику", "Уравнение касательной, касательная параллельная прямой.", 2, 45, 14, "high", ["a9-rules", "a5-lin"], tag("uravnenie-kasatelnoy")],
  ["a9-mono", "Возрастание, убывание и экстремумы", "Промежутки монотонности и точки экстремума.", 2, 45, 14, "high", ["a9-rules", "a4-quad"], tag("promezhutok-vozrastaniya-funktsii")],
  ["a9-extr", "Наибольшее и наименьшее значения функции", "Исследование на отрезке.", 1, 45, 10, "high", ["a9-mono"], tag("naibolshee-znachenie-funktsii")],
  ["a9-second", "Вторая производная и анализ функции", "Выпуклость, точки перегиба, свойства функции и производной.", 1, 45, 10, "normal", ["a9-mono"], mathPractice("Вторая производная")],

  ["a10-anti", "Первообразная", "Таблица первообразных и неопределённый интеграл.", 1, 45, 10, "high", ["a9-rules"], tag("integraly")],
  ["a10-int", "Определённый интеграл", "Формула Ньютона — Лейбница, замена переменной.", 2, 45, 12, "high", ["a10-anti"], tag("opredelyonnyy-integral")],
  ["a10-area", "Площадь криволинейной трапеции", "Площадь фигуры под графиком.", 1, 45, 10, "high", ["a10-int"], tag("ploschad-krivolineynoy-trapetsii")],

  ["a11-mix1", "Смешанные задачи: уравнения и неравенства", "Многошаговые задачи на уравнения, неравенства и ОДЗ.", 2, 60, 20, "high", ["a4-systems", "a3-systems"], mathAll],
  ["a11-mix2", "Смешанные задачи: функции, логарифмы, тригонометрия", "Комбинации тем из модулей 5–7.", 2, 60, 20, "high", ["a6-logineq", "a7-eqadv"], mathAll],
  ["a11-mix3", "Смешанные задачи: анализ и прогрессии", "Производная, интеграл и прогрессии вместе.", 2, 60, 20, "high", ["a9-extr", "a10-area", "a8-inf"], mathAll],
  ["a11-variants", "Разбор вариантов ЕНТ и ошибок", "Полные варианты с таймером и работа над ошибками.", 3, 60, 40, "high", ["a11-mix1", "a11-mix2", "a11-mix3"], "https://bilimqor.kz/ent/math"],

  // ───── Геометрия ─────
  ["g1-triangles", "Треугольники: свойства и площадь", "Виды треугольников, медиана, высота, площадь.", 2, 45, 14, "high", ["a2-powers"], tag("ploschad-treugolnika")],
  ["g1-right", "Прямоугольный треугольник и теорема Пифагора", "Пифагор, треугольник с углом 30°, стороны.", 1, 45, 10, "high", ["g1-triangles"], tag("pryamougolnyy-treugolnik")],
  ["g1-sincos", "Теоремы синусов и косинусов", "Решение произвольных треугольников.", 2, 45, 12, "high", ["g1-right", "a7-values"], tag("teorema-kosinusov")],
  ["g1-quad", "Параллелограмм, ромб, прямоугольник", "Свойства, площади и диагонали.", 2, 45, 12, "normal", ["g1-right"], tag("parallelogramm")],
  ["g1-trap", "Трапеция", "Средняя линия, высота, равнобедренная трапеция.", 2, 45, 12, "high", ["g1-quad"], mathPractice("Равнобедренная трапеция")],
  ["g1-circle", "Вписанная и описанная окружности", "Радиусы окружностей и связанные формулы.", 2, 45, 12, "high", ["g1-triangles"], tag("vpisannaya-okruzhnost")],
  ["g1-general", "Планиметрия: смешанные задачи", "Задачи с чертежом на несколько тем сразу.", 2, 45, 16, "high", ["g1-sincos", "g1-trap", "g1-circle"], mathPractice("Геометрия")],

  ["g2-seg", "Середина и длина отрезка, прямая на плоскости", "Координаты середины, расстояние, уравнение прямой.", 1, 45, 10, "high", ["a5-lin"], mathPractice("Координатная геометрия")],
  ["g2-circle", "Уравнение окружности", "Центр и радиус, окружность на координатной плоскости.", 1, 45, 10, "high", ["g2-seg", "a2-fsu"], mathPractice("Окружность на координатной плоскости")],

  ["g3-coords", "Координаты вектора и действия с векторами", "Сложение, умножение на число, длина вектора.", 1, 45, 10, "high", ["g2-seg"], mathPractice("Векторы")],
  ["g3-dot", "Скалярное произведение и угол между векторами", "Формулы и угол между векторами.", 2, 45, 14, "high", ["g3-coords", "a7-values"], mathPractice("Угол между векторами")],
  ["g3-space", "Векторы в пространстве", "Координаты и длина вектора в пространстве.", 2, 45, 12, "high", ["g3-coords"], tag("vektory-v-prostranstve")],
  ["g3-box", "Векторы в параллелепипеде", "Разложение векторов по рёбрам.", 1, 45, 10, "normal", ["g3-space"], mathPractice("Векторы в параллелепипеде")],

  ["g4-box", "Прямоугольный параллелепипед и призма", "Диагонали, объём, площадь поверхности.", 2, 45, 12, "high", ["g1-general"], tag("pryamougolnyy-parallelepiped")],
  ["g4-pyramid", "Правильная пирамида", "Апофема, высота, объём и площадь поверхности.", 2, 45, 14, "high", ["g4-box", "g1-right"], mathPractice("Правильная пирамида")],
  ["g4-round", "Цилиндр и конус", "Объёмы и площади поверхности тел вращения.", 2, 45, 12, "high", ["g4-box", "g1-circle"], tag("obyom-konusa")],
  ["g4-sphere", "Шар и сфера", "Объём шара, площадь сферы, вписанные тела.", 1, 45, 8, "normal", ["g4-round"], tag("obyom-shara")],
  ["g4-lines", "Наклонные, проекции, расстояния и углы", "Углы между прямыми и плоскостями, проекции.", 2, 45, 12, "high", ["g4-pyramid"], tag("naklonnye-i-proektsii")],
  ["g4-mix", "Стереометрия: смешанные задачи", "Комбинированные задачи с чертежом.", 2, 45, 16, "high", ["g4-lines", "g4-sphere"], mathPractice("Стереометрия")],

  // ───── Информатика ─────
  ["i1-numbers", "Системы счисления", "Перевод между 2, 8, 10, 16; двоичная арифметика.", 3, 45, 24, "foundation", [], infPractice("Системы Счисления"), ["Перевод между системами", "Двоичная арифметика", "Смешанная практика ЕНТ"]],
  ["i1-info", "Измерение и кодирование информации", "Единицы измерения, объём сообщений, алфавит и кодирование.", 2, 45, 16, "high", ["i1-numbers"], infPractice("Измерение Информации")],
  ["i1-logic", "Логические выражения и таблицы истинности", "Операции И, ИЛИ, НЕ, таблицы истинности, схемы.", 2, 45, 16, "high", ["i1-numbers"], infPractice("Логические Выражения")],
  ["i1-graphics", "Компьютерная графика", "Растровая и векторная графика, глубина цвета.", 1, 40, 6, "normal", ["i1-info"], infPractice("Компьютерная Графика")],

  ["i2-algo", "Алгоритмы: блок-схемы, сортировки, сложность", "Читать блок-схемы и выбирать алгоритм сортировки.", 2, 45, 10, "normal", ["i1-logic"], infPractice("Алгоритмы")],
  ["i2-basics", "Python: переменные, ввод и вывод, арифметика", "Типы данных, операции %, //, форматирование.", 2, 45, 14, "high", ["i1-numbers"], infPractice("Программирование Python")],
  ["i2-cond", "Python: условия и циклы", "if/else, for, while и вложенные циклы.", 3, 45, 20, "high", ["i2-basics", "i1-logic"], infPractice("Программирование Python")],
  ["i2-strings", "Python: строки и списки", "Срезы, методы строк и списков, max/min/sum.", 3, 45, 18, "high", ["i2-cond"], infPractice("Программирование Python")],
  ["i2-func", "Python: функции и рекурсия", "Определение функций, параметры, рекурсия.", 2, 45, 12, "high", ["i2-strings"], infPractice("Программирование Python")],
  ["i2-trace", "Python: трассировка кода и файлы", "Что выведет программа: пошаговая трассировка.", 3, 45, 16, "high", ["i2-func", "i2-algo"], infPractice("Программирование Python")],

  ["i3-db", "Базы данных: таблицы, ключи, связи", "Первичный и внешний ключи, связи между таблицами.", 2, 45, 12, "high", ["i1-info"], infPractice("Базы Данных")],
  ["i3-select", "SQL: SELECT, WHERE, LIKE, сортировка", "Выборка данных и условия отбора.", 2, 45, 14, "high", ["i3-db"], infPractice("SQL Запросы")],
  ["i3-modify", "SQL: INSERT, UPDATE, DELETE, агрегаты", "Изменение данных и функции COUNT, SUM, AVG.", 2, 45, 12, "high", ["i3-select"], infPractice("SQL Базы Данных")],
  ["i3-sheets", "Электронные таблицы: формулы и функции", "СУММ, СЧЁТ, ЕСЛИ и другие функции.", 2, 45, 14, "high", ["i1-numbers"], infPractice("Электронные Таблицы")],
  ["i3-refs", "Электронные таблицы: ссылки и диаграммы", "Абсолютные и относительные ссылки.", 1, 45, 8, "normal", ["i3-sheets"], infPractice("Электронные Таблицы")],

  ["i4-hw", "Устройство компьютера", "Процессор, память, устройства ввода и вывода.", 1, 40, 8, "normal", [], infPractice("Аппаратное Обеспечение")],
  ["i4-soft", "ПО, операционные системы и облачные технологии", "Виды ПО, ОС, облачные модели.", 1, 40, 8, "normal", ["i4-hw"], infPractice("Программное Обеспечение")],
  ["i4-net", "Сети, интернет и IP-адресация", "Топологии, протоколы, IP-адреса.", 2, 45, 12, "high", ["i4-hw", "i1-info"], infPractice("Сети")],

  ["i5-html", "HTML: теги, списки, таблицы, ссылки", "Структура страницы и основные теги.", 2, 45, 16, "normal", [], infPractice("HTML")],
  ["i5-css", "HTML и CSS: стили и основы JavaScript", "Селекторы, свойства и подключение стилей.", 1, 45, 8, "normal", ["i5-html"], tag("html-css", "inf")],

  ["i6-sec", "Информационная безопасность", "Угрозы, защита данных, шифрование.", 1, 40, 8, "normal", ["i4-net"], infPractice("Информационная Безопасность")],
  ["i6-mix", "Информатика: смешанные задачи ЕНТ", "Все темы вперемешку и разбор вариантов.", 3, 60, 30, "high", ["i2-trace", "i3-modify", "i4-net", "i5-css", "i6-sec"], infAll],
]

const subjectByPrefix: Record<string, Subject> = { a: "algebra", g: "geometry", i: "informatics" }

export const topics: Topic[] = rows.map(
  ([id, title, description, sessionsTotal, estimatedMinutesPerSession, practiceTarget, priority, prerequisites, bilimqorUrl, sessionTitles]) => {
    const moduleId = id.split("-")[0]
    const subject = subjectByPrefix[moduleId[0]]
    return {
      id,
      subject,
      moduleId,
      title,
      description,
      prerequisites,
      sessionsTotal,
      estimatedMinutesPerSession,
      practiceTarget,
      priority,
      reviewDays: [2, 7, 21],
      bilimqorUrl,
      officialSourceUrl: subject === "informatics" ? INFO_SPEC_URL : MATH_SPEC_URL,
      defaultStatus: "not_started" as const,
      sessionTitles,
    }
  },
)

export const topicById: Record<string, Topic> = Object.fromEntries(topics.map((topic) => [topic.id, topic]))
export const moduleById: Record<string, StudyModule> = Object.fromEntries(modules.map((module) => [module.id, module]))

export function modulesOf(subject: Subject) {
  return modules.filter((module) => module.subject === subject).sort((a, b) => a.order - b.order)
}

export function topicsOfModule(moduleId: string) {
  return topics.filter((topic) => topic.moduleId === moduleId)
}

export function topicsOfSubject(subject: Subject) {
  return topics.filter((topic) => topic.subject === subject)
}

/** Тема с 3+ сессиями считается сложной и получает больше времени. */
export const isHardTopic = (topic: Topic) => topic.sessionsTotal >= 3

export function sessionTitle(topic: Topic, sessionNo: number) {
  const custom = topic.sessionTitles?.[sessionNo - 1]
  if (custom) return custom
  if (topic.sessionsTotal === 1) return "Правила, примеры и практика"
  if (sessionNo === 1) return "Правила и базовые примеры"
  if (sessionNo === topic.sessionsTotal) return "Смешанная практика и разбор ошибок"
  return `Практика · блок ${sessionNo - 1}`
}

export function tasksPerSession(topic: Topic) {
  return Math.max(6, Math.ceil(topic.practiceTarget / topic.sessionsTotal))
}

export function sessionOutcome(topic: Topic, sessionNo: number) {
  return `${sessionTitle(topic, sessionNo)} — решить ${tasksPerSession(topic)} задач без подсказок`
}

export function sessionSteps(topic: Topic, sessionNo: number) {
  const n = tasksPerSession(topic)
  return [
    sessionNo === 1 ? "Разобрать ключевые правила темы" : "Быстро вспомнить правила прошлой сессии",
    `Решить ${n} задач в тренажёре`,
    "Записать ошибки и вопросы, которые остались",
  ]
}

export const totalSessions = topics.reduce((sum, topic) => sum + topic.sessionsTotal, 0)
