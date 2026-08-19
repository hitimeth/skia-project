const express = require('express');
const cors = require('cors'); 
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer'); 
const fs = require('fs');


const app = express();
const port = 3000;

const allowedOrigins = [
  'http://localhost:5173',                      // 내 컴퓨터에서 테스트할 때 (로컬)
  'http://127.0.0.1:5173',
  'http://3.38.80.197:5173'                     // 🚨 탄력적IP:포트번호
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단된 요청입니다.'));
    }
  },
  credentials: true
}));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',                        
  database: 'skia',
  port: 5432                                 
});

// JSON 및 FormData 파싱 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 업로드 폴더 생성
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'uploads/')); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// 📡 [B 구역] 유저 추천 덱 공유 게시판 API
// ==========================================

// 1. 전체 덱 목록 조회 (최신 등록순)
app.get('/api/decks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM skia_deck_share_board ORDER BY log_date DESC, board_id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시판 조회 중 오류가 발생했습니다.' });
  }
});


// 📡 로그인 라우트 (정상 유지)
app.post('/api/login', async (req, res) => {
  const { user_id, password } = req.body;
  try {
    const queryText = 'SELECT * FROM member WHERE user_id = $1';
    const result = await pool.query(queryText, [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '존재하지 않는 아이디입니다.' });
    }
    
    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 🎯 한국 시간(Asia/Seoul)으로 로그인 타임스탬프 저장
    await pool.query(
      "INSERT INTO skia_login_log (user_id, login_at) VALUES ($1, NOW() AT TIME ZONE 'Asia/Seoul')",
      [user.user_id]
    );

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('로그인 DB 조회 및 이력 저장 에러:', err);
    res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.' });
  }
});

// 📡 이미지 첨부형 질문 게시판 (Board) API
app.get('/api/posts', async (req, res) => {
  try {
    const postsResult = await pool.query("SELECT id, author, content, image, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date FROM posts ORDER BY id DESC");
    const posts = postsResult.rows;
    if (posts.length > 0) {
      const repliesResult = await pool.query("SELECT id, post_id, author, content, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date FROM post_replies ORDER BY id ASC");
      const replies = repliesResult.rows;
      posts.forEach(post => { post.replies = replies.filter(reply => reply.post_id === post.id); });
    }
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '데이터를 가져오는 중 서버 에러가 발생했습니다.' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { author, content, image } = req.body;
  if (!author || !content) return res.status(400).json({ error: '작성자와 내용을 모두 입력해 주세요.' });
  try {
    const result = await pool.query("INSERT INTO posts (author, content, image) VALUES ($1, $2, $3) RETURNING id, author, content, image, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date", [author, content, image]);
    const newPost = result.rows[0];
    newPost.replies = [];
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: '서버에 저장하는 중 에러가 발생했습니다.' });
  }
});

app.post('/api/posts/:postId/replies', async (req, res) => {
  const postId = req.params.postId;
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: '답변자와 내용을 모두 입력해 주세요.' });
  try {
    const result = await pool.query("INSERT INTO post_replies (post_id, author, content) VALUES ($1, $2, $3) RETURNING id, post_id, author, content, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date", [postId, author, content]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '답변을 저장하는 중 에러가 발생했습니다.' });
  }
});

app.patch('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const { author, content } = req.body; 
  if (!content || !content.trim()) return res.status(400).json({ message: '수정할 내용을 입력해 주세요.' });
  
  try {
    const result = await pool.query(
      'UPDATE posts SET author = $1, content = $2 WHERE id = $3 RETURNING *', 
      [author ? author.trim() : '익명', content.trim(), postId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: '해당 게시글을 찾을 수 없습니다.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
  }
});

app.put('/api/posts/:postId/replies/:replyId', async (req, res) => {
  const { postId, replyId } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: '수정할 답변 내용을 입력해 주세요.' });
  try {
    const result = await pool.query('UPDATE post_replies SET content = $1 WHERE id = $2 AND post_id = $3 RETURNING *', [content.trim(), replyId, postId]);
    if (result.rows.length === 0) return res.status(404).json({ message: '해당 답변 또는 게시글을 찾을 수 없습니다.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    await pool.query('DELETE FROM post_replies WHERE post_id = $1', [postId]);
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [postId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '해당 게시글을 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '게시글이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    console.error('게시글 삭제 중 에러:', err);
    res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
  }
});

app.delete('/api/posts/:postId/replies/:replyId', async (req, res) => {
  const { postId, replyId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM post_replies WHERE id = $1 AND post_id = $2 RETURNING *',
      [replyId, postId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '해당 답변을 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '답변이 삭제되었습니다.' });
  } catch (err) {
    console.error('답변 삭제 중 에러:', err);
    res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
  }
});


// [🎮 캐릭터 관련 라우트]

app.get('/api/char', async (req, res) => {
  try {
    const result = await pool.query('SELECT master_id, char_id, char_name, is_awk_yn, nickname FROM skia_char ORDER BY nickname ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('캐릭터 목록을 조회하는 중 에러가 발생했습니다.');
  }
});

// 2. 캐릭터 상세 및 스킬 정보 조회 (WHERE master_id 기준)
app.get('/api/char_detail/:master_id', async (req, res) => {
  const { master_id } = req.params;

  if (!master_id || master_id.trim() === '') {
    console.warn(`⚠️ 올바르지 않은 master_id 요청 사전 차단`);
    return res.status(400).send('올바르지 않은 캐릭터 마스터 ID 형식입니다.');
  }

  try {
    const baseResult = await pool.query(
      'SELECT * FROM skia_char WHERE master_id = $1', 
      [master_id]
    );
    
    const buffResult = await pool.query(
      `SELECT b.* 
      FROM skia_char_buff b 
      left join skia_code c on c.code_id = b.effect_code
      WHERE master_id = $1 ORDER BY b.skill_code, b.buff_name, c.sort_order `, 
      [master_id]
    );
    
    if (baseResult.rows.length === 0) {
      return res.status(404).send('해당 캐릭터를 찾을 수 없습니다.');
    }
    
    res.json({ 
      base: baseResult.rows[0], 
      buffs: buffResult.rows 
    });
  } catch (err) {
    console.error("캐릭터 상세 정보 조회 중 DB 에러:", err);
    res.status(500).send('상세 정보 조회 중 에러가 발생했습니다.');
  }
});

// 🌟 캐릭터 기본정보 수정 시 skia_char_buff 및 skia_char_effect의 char_id도 함께 업데이트 (트랜잭션 적용)
app.patch('/api/char_detail/:master_id', async (req, res) => {
  const { master_id } = req.params;
  
  // 🌟 프론트엔드가 char_id, charId 중 어떤 키로 보내더라도 안전하게 수신
  const char_id = req.body.char_id || req.body.charId || req.body.CHAR_ID;
  const { char_name, grade_name, char_group_name, battle_type, attack_style_code, is_awk_yn, char_detail, reg_date, upt_date } = req.body;

  // 🌟 char_id 검증 추가 (null이 전달되어 Postgres DB 에러가 나는 것을 사전에 방지)
  if (!char_id || !String(char_id).trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'char_id(캐릭터 ID)가 누락되었습니다. 데이터를 확인해주세요.' 
    });
  }

  const client = await pool.connect(); // 트랜잭션용 커넥션 생성

  try {
    await client.query('BEGIN'); // 🚀 트랜잭션 시작

    // 0. 기존 skia_char에서 old char_id 가져오기 (skia_char_effect 동기화용)
    const oldCharRes = await client.query('SELECT char_id FROM skia_char WHERE master_id = $1', [master_id]);
    const old_char_id = oldCharRes.rows.length > 0 ? oldCharRes.rows[0].char_id : null;

    // 1. skia_char (캐릭터 마스터) UPDATE
    const queryText = `
      UPDATE skia_char 
      SET char_id = $1, 
          char_name = $2, 
          grade_name = $3, 
          char_group_name = $4, 
          battle_type = $5, 
          attack_style_code = $6, 
          is_awk_yn = $7,
          char_detail = $8,
          reg_date = $9,
          upt_date = $10
      WHERE master_id = $11 RETURNING *
    `;
    
    const values = [
      char_id.trim(), 
      char_name || null, 
      grade_name || null, 
      char_group_name || null, 
      battle_type || '근거리형', 
      attack_style_code || null, 
      is_awk_yn || 'N', 
      char_detail || null, 
      reg_date || null,    
      upt_date || null,    
      master_id            
    ];
    
    const result = await client.query(queryText, values);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).send('해당 캐릭터 마스터 정보를 찾을 수 없습니다.');
    }

    // 🌟 2. skia_char_buff (스킬/버프 테이블)의 char_id 일괄 동시 업데이트
    const updateBuffCharIdQuery = `
      UPDATE skia_char_buff
      SET char_id = $1
      WHERE master_id = $2
    `;
    await client.query(updateBuffCharIdQuery, [char_id.trim(), master_id]);

    // 🌟 3. skia_char_effect (추천 버프 테이블)의 char_id도 동시 업데이트
    if (old_char_id) {
      const updateEffectCharIdQuery = `
        UPDATE skia_char_effect
        SET char_id = $1
        WHERE char_id = $2
      `;
      await client.query(updateEffectCharIdQuery, [char_id.trim(), old_char_id]);
    }

    await client.query('COMMIT'); // 🚀 트랜잭션 커밋
    client.release();

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK'); // 에러 시 원복
    client.release();
    console.error('❌ [기본정보 및 버프 char_id 저장 실패] PostgreSQL 에러:', err.message);
    res.status(500).send(`DB 필드 오류: ${err.message}`);
  }
});

// 1. 🌟 [수정 완료] 버프 정보 수정 API (UPDATE) - 파라미터 매핑 번호($1~$22) 정확히 보정
app.put('/api/char_buff_update', async (req, res) => {
  try {
    const { 
      buff_seq, char_id, skill_range, skill_cool_time, target_code, target_point_code, 
      buff_name, buff_condition, effect_code, effect_code_name, effect_value, 
      value_unit, effect_duration, range_type, range_detail, remark, is_awk_yn,
      sort_order, hit_count, max_stack, range_x, range_y
    } = req.body;

    const queryText = `
      UPDATE skia_char_buff 
      SET char_id = COALESCE($1, char_id),
          skill_range = $2, 
          skill_cool_time = $3, 
          target_code = $4, 
          target_point_code = $5, 
          buff_name = $6, 
          buff_condition = $7, 
          effect_code = $8, 
          effect_code_name = $9, 
          effect_value = $10, 
          value_unit = $11, 
          effect_duration = $12, 
          range_type = $13, 
          range_detail = $14, 
          remark = $15, 
          is_awk_yn = $16,
          sort_order = $17,
          hit_count = $18,
          max_stack = $19,
          range_x = $20,
          range_y = $21
      WHERE buff_seq = $22
    `;

    const values = [
      char_id || null,             // $1
      skill_range || null,         // $2
      skill_cool_time || null,     // $3
      target_code || null,         // $4
      target_point_code || null,   // $5
      buff_name || null,           // $6
      buff_condition || null,      // $7
      effect_code || null,         // $8
      effect_code_name || null,    // $9
      effect_value || null,        // $10
      value_unit || null,          // $11
      effect_duration || null,     // $12
      range_type || null,          // $13
      range_detail || null,        // $14
      remark || null,              // $15
      is_awk_yn || 'N',            // $16
      sort_order || null,          // $17
      hit_count || null,           // $18
      max_stack || null,           // $19
      range_x || null,             // $20
      range_y || null,             // $21
      buff_seq                     // $22 (WHERE 조건 고유키)
    ];

    await pool.query(queryText, values);
    res.json({ success: true });
  } catch (err) {
    console.error('스킬 저장 중 상세 에러:', err);
    res.status(500).send(`스킬 정보 수정 중 에러가 발생했습니다: ${err.message}`);
  }
});

// 2. 신규 버프 추가 API (INSERT)
app.post('/api/char_buff_insert', async (req, res) => {
  try {
    const { 
      master_id, char_id, skill_code, skill_range, skill_cool_time, 
      target_code, target_point_code, buff_name, buff_condition, effect_code, 
      effect_code_name, effect_value, value_unit, effect_duration, range_type, 
      range_detail, remark, is_awk_yn, sort_order, hit_count, max_stack, range_x, range_y
    } = req.body;

    const queryText = `
      INSERT INTO skia_char_buff (
        master_id, char_id, skill_code, skill_range, skill_cool_time, 
        target_code, target_point_code, buff_name, buff_condition, effect_code, 
        effect_code_name, effect_value, value_unit, effect_duration, range_type, 
        range_detail, remark, is_awk_yn, sort_order, hit_count, max_stack, range_x, range_y
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
        $21, $22, $23
      ) 
      RETURNING buff_seq;
    `;

    const values = [
      master_id, 
      char_id, 
      skill_code || null, 
      skill_range || null, 
      skill_cool_time || null, 
      target_code || null, 
      target_point_code || null, 
      buff_name || null, 
      buff_condition || null, 
      effect_code || null, 
      effect_code_name || null, 
      effect_value || null, 
      value_unit || null, 
      effect_duration || null, 
      range_type || null, 
      range_detail || null, 
      remark || null, 
      is_awk_yn || 'N',
      sort_order || null,
      hit_count || null,
      max_stack || null,
      range_x || null,
      range_y || null
    ];

    const result = await pool.query(queryText, values);
    res.json({ success: true, buff_seq: result.rows[0].buff_seq });
  } catch (err) {
    console.error('신규 스킬 추가 중 에러:', err);
    res.status(500).send(`신규 스킬 추가 중 에러가 발생했습니다: ${err.message}`);
  }
});

// ❌ 캐릭터 스킬/버프 단일 행 삭제 API
app.delete('/api/char_buff_delete/:buff_seq', async (req, res) => {
  const { buff_seq } = req.params;

  const parsedBuffSeq = parseInt(buff_seq, 10);
  if (isNaN(parsedBuffSeq)) {
    console.warn(`⚠️ 숫자가 아닌 buff_seq 삭제 요청 차단: "${buff_seq}"`);
    return res.status(400).json({ 
      success: false, 
      message: '올바르지 않은 버프 시퀀스 형식입니다. (숫자만 가능)' 
    });
  }

  try {
    // 🎯 고유키(buff_seq)를 기준으로 데이터 삭제 쿼리 실행
    const result = await pool.query(
      'DELETE FROM skia_char_buff WHERE buff_seq = $1', 
      [parsedBuffSeq]
    );

    // 🔍 삭제된 행이 있는지 확인 (이미 지워졌거나 없는 번호인 경우 대응)
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '삭제할 데이터를 찾을 수 없거나 이미 삭제되었습니다.' 
      });
    }

    // ✨ 삭제 성공 반환 (프론트엔드에서 data.success 조건을 만족하도록 포맷 매핑)
    res.json({ 
      success: true, 
      message: `고유키 ${parsedBuffSeq}번 스킬 데이터가 정상적으로 삭제되었습니다.` 
    });

  } catch (err) {
    console.error("스킬 삭제 중 DB 에러 발생:", err);
    res.status(500).json({ 
      success: false, 
      message: '스킬 데이터 삭제 중 서버 에러가 발생했습니다.' 
    });
  }
});


// 📡 [관리자 서비스 관련 API]

app.get('/api/admin/members', async (req, res) => {
  const { userId } = req.query; 
  try {
    const authCheck = await pool.query(`SELECT role FROM member WHERE user_id = $1`, [userId]);
    if (authCheck.rows.length === 0 || authCheck.rows[0].role !== 'ADMIN') {
      return res.status(403).json({ message: '접근 권한이 없습니다. 꼼수 금지!' });
    }
    const query = `SELECT member_id, user_id, password, role, is_active FROM member ORDER BY member_id ASC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러' });
  }
});

app.post('/api/admin/members/update', async (req, res) => {
  const { member_id, password, is_active } = req.body;
  try {
    const query = `UPDATE member SET password = $1, is_active = $2, updated_at = NOW() WHERE member_id = $3`;
    await pool.query(query, [password, is_active, member_id]);
    res.json({ success: true, message: '업데이트 성공' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '업데이트 실패' });
  }
});

app.get('/api/admin/check-auth', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ isAdmin: false });
  try {
    const query = `SELECT role FROM member WHERE user_id = $1 AND is_active = true`;
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0 && result.rows[0].role === 'ADMIN') {
      return res.json({ isAdmin: true });
    }
    res.json({ isAdmin: false });
  } catch (error) {
    console.error('인증 체크 중 에러:', error);
    res.status(500).json({ isAdmin: false });
  }
});

// ==========================================
// 📡 [B 구역] 유저 추천 덱 공유 게시판 API
// ==========================================

app.get('/api/decks/arena-characters', async (req, res) => {
  const { category } = req.query;

  let limitCount = 10;
  if (category === '상급결투장' || category === '천상결투장') {
    limitCount = 30;
  } else if (category === '깊은밤의악몽') {
    limitCount = 45;
  }

  try {
    const query = `
      WITH target_chars AS (
        SELECT master_id, char_id, char_name, is_awk_yn, reg_date
        FROM skia_char
        ORDER BY reg_date DESC, master_id ASC
        LIMIT $1
      )
      SELECT 
        c.master_id,
        c.char_id,
        c.char_name,
        c.is_awk_yn,
        b.* FROM target_chars c
      LEFT JOIN skia_char_buff b ON c.master_id = b.master_id
      ORDER BY c.reg_date DESC, c.master_id ASC, b.buff_seq ASC
    `;

    const result = await pool.query(query, [limitCount]);
    
    const characterMap = new Map();
    result.rows.forEach(row => {
      if (!characterMap.has(row.master_id)) {
        characterMap.set(row.master_id, {
          master_id: row.master_id,
          char_id: row.char_id,
          char_name: row.char_name,
          is_awk_yn: row.is_awk_yn,
          buffs: [] 
        });
      }
      
      if (row.buff_id) {
        const { master_id, char_id, char_name, is_awk_yn, reg_date, ...buffData } = row;
        characterMap.get(row.master_id).buffs.push(buffData);
      }
    });

    const refinedCharacters = Array.from(characterMap.values());
    res.json({
      success: true,
      category: category,
      count: refinedCharacters.length,
      data: refinedCharacters
    });

  } catch (error) {
    console.error('skia_char_buff 전체 컬럼 (*), 최대 30명 조회 에러:', error);
    res.status(500).json({ success: false, message: '데이터베이스 조회 실패' });
  }
});

// 🎯 [신규 추가] 특정 덱 상세 정보 단건 조회 API 
// (상세 보기 화면 진입 및 수정 모드에서 특정 덱 데이터를 불러올 때 필수)
app.get('/api/decks/:board_id', async (req, res) => {
  const { board_id } = req.params;

  // 💡 안전장치: board_id가 숫자가 아닐 경우 DB 조회를 하지 않고 에러 처리하여 Postgres 에러(22P02)를 원천 차단합니다.
  const parsedBoardId = parseInt(board_id, 10);
  if (isNaN(parsedBoardId)) {
    console.warn(`⚠️ 숫자가 아닌 board_id 요청이 들어와 차단했습니다: "${board_id}"`);
    return res.status(400).json({ error: '올바르지 않은 게시글 번호 형식입니다.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM skia_deck_share_board WHERE board_id = $1',
      [parsedBoardId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 덱 정보를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '덱 정보를 불러오는 중 에러가 발생했습니다.' });
  }
});

// 🎯 2. 악몽 전용 API (/api/decks/nightmare)
// 프론트엔드가 이 주소를 호출하면, :board_id로 빠지지 않고 이 함수가 바로 응답합니다.
app.get('/api/decks/nightmare', async (req, res) => {
  try {
    // 💡 공백을 없애고 '깊은밤의악몽'으로 조회하도록 쿼리를 수정합니다.
    const result = await pool.query(
      "SELECT * FROM skia_deck_share_board WHERE category = '깊은밤의악몽' ORDER BY log_date DESC, board_id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('악몽 덱 조회 에러:', err);
    res.status(500).json({ error: '악몽 카테고리 덱 조회 중 오류가 발생했습니다.' });
  }
});

// 🎯 3. 전체 덱 목록 조회
app.get('/api/decks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM skia_deck_share_board ORDER BY log_date DESC, board_id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시판 조회 중 오류가 발생했습니다.' });
  }
});

// 🎯 4. 신규 덱 등록 (POST)
app.post('/api/decks', upload.single('deckImage'), async (req, res) => {
  try {
    const { title, category, log_date, deck_content1, deck_content2, deck_content3 } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const queryText = `
      INSERT INTO skia_deck_share_board (title, category, log_date, deck_content1, deck_content2, deck_content3, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [title, category, log_date, deck_content1 || null, deck_content2 || null, deck_content3 || null, image_url];
    const result = await pool.query(queryText, values);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '글 등록 중 에러가 발생했습니다.' });
  }
});


// 🎯 5. 덱 수정 (PUT)
// (:board_id가 들어간 주소는 최하단에 배치하여 다른 텍스트 주소 호출을 방해하지 않게 합니다.)
app.put('/api/decks/:board_id', upload.single('deckImage'), async (req, res) => {
  const { board_id } = req.params;

  // 💡 숫자가 아닌 텍스트가 파라미터로 넘어올 경우를 완벽하게 차단합니다.
  const parsedBoardId = parseInt(board_id, 10);
  if (isNaN(parsedBoardId)) {
    return res.status(400).json({ error: '올바르지 않은 게시글 번호 형식입니다.' });
  }

  try {
    const { title, category, log_date, deck_content1, deck_content2, deck_content3, existing_image_url } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : existing_image_url;
    const queryText = `
      UPDATE skia_deck_share_board 
      SET title = $1, category = $2, log_date = $3, deck_content1 = $4, deck_content2 = $5, deck_content3 = $6, image_url = $7
      WHERE board_id = $8
    `;
    await pool.query(queryText, [title, category, log_date, deck_content1, deck_content2, deck_content3, image_url, parsedBoardId]);
    res.json({ success: true, message: '성공적으로 수정되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '글 수정 중 에러가 발생했습니다.' });
  }
});

// 🎯 6. 덱 삭제 (DELETE)
app.delete('/api/decks/:board_id', async (req, res) => {
  const { board_id } = req.params;

  const parsedBoardId = parseInt(board_id, 10);
  if (isNaN(parsedBoardId)) {
    return res.status(400).json({ error: '올바르지 않은 게시글 번호 형식입니다.' });
  }

  try {
    await pool.query('DELETE FROM skia_deck_share_board WHERE board_id = $1', [parsedBoardId]);
    res.json({ success: true, message: '글이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '글 삭제 중 에러가 발생했습니다.' });
  }
});


// 🎯 캐릭터 배치 정보 일괄 조회 API (skia_code direct join 교정본)
app.post('/api/chars/batch', async (req, res) => {
  const { charIds } = req.body; 
  if (!charIds || !Array.isArray(charIds) || charIds.length === 0) return res.json([]);

  try {
    const paramPlaceholders = charIds.map((_, index) => `$${index + 1}`).join(', ');
    const uppercaseCharIds = charIds.map(id => id.toUpperCase());

    //console.log("🔍 [DEBUG] batch charIds 조회 uppercaseCharIds:", uppercaseCharIds);
    
    const query = `
       SELECT 
         x.sort_order,
         c.master_id, 
         c.char_id as id, 
         c.char_name, 
         c.nickname as name, 
         c.is_awk_yn, 
         b.buff_seq, 
         b.skill_code, 
         b.buff_name, 
         b.skill_range, 
         b.target_code,
         b.target_point_code,  
         b.effect_code, 
         x.code_name_short, 
         x.code_name AS effect_code_name,
         t.code_name AS target_code_name,
         g.effect_type,
         b.range_type, 
         b.range_detail, 
         COALESCE(b.effect_value::text, '') || COALESCE(b.value_unit, '') AS effect_value
       FROM skia_char c
       LEFT JOIN skia_char_buff b ON c.master_id = b.master_id
       JOIN skia_code x ON b.effect_code = x.code_id
       LEFT JOIN skia_code t ON b.target_code = t.code_id
       LEFT JOIN skia_group_code g ON x.code_group = g.code_group
       WHERE UPPER(c.char_id) IN (${paramPlaceholders})
       ORDER BY x.sort_order
    `;
//console.log("🔍 [DEBUG] batch charIds 조회 쿼리:", query);

    const result = await pool.query(query, uppercaseCharIds);
    const characterMap = new Map();

    result.rows.forEach(row => {
      const rawId = row.id || row.char_id;
      if (!rawId) return;
      const charKey = rawId.toUpperCase();

      if (!characterMap.has(charKey)) {
        characterMap.set(charKey, {
          master_id: row.master_id,
          id: rawId,
          // ⭐️ [해결] 프론트엔드 드래그앤드롭 및 리스트 매칭을 위한 instanceId 규격 강제 부여
          instanceId: String(row.master_id), 
          name: row.name || row.char_name,
          image_url: `https://placehold.co/26`, 
          color: getRandomColorById(rawId),
          skills: { "일반공격": 35, "치명타공격": 35, "액티브공격": 40 },
          // ⭐️ [해결] 프론트 순회 에러 방지를 위해 임시 객체가 아닌 최종 배열 형태로 담을 준비
          buffs: {}, 
          receivingBuffs: []
        });
      }
      const currentChar = characterMap.get(charKey);

      if (row.buff_seq && row.skill_code) {
        let skillKey = '일반공격';
        if (row.skill_code === 'SKI01') skillKey = '일반공격';
        if (row.skill_code === 'SKI02') skillKey = '치명타공격';
        if (row.skill_code === 'SKI03') skillKey = '액티브공격';

        if (row.skill_range) currentChar.skills[skillKey] = Number(row.skill_range);

        const isNewDataValid = row.range_type && row.range_type.trim() !== '';

        // 임시 맵핑 객체에 버프 데이터 적재
        if (!currentChar.buffs[row.buff_seq] || isNewDataValid) {
          currentChar.buffs[row.buff_seq] = {       
            buff_seq: row.buff_seq,
            name: row.buff_name || '',
            skill_code: row.skill_code || null,
            skill_range: row.skill_range || null,
            target_code: row.target_code || null,
            target_point_code: row.target_point_code || null,
            effect_code: row.effect_code || null,
            effect_code_name_short: row.code_name_short || null,
            effect_code_name: row.effect_code_name || row.buff_name || null,
            target_code_name: row.target_code_name || null,
            effect_type: row.effect_type || '', 
            effect_value: row.effect_value ? row.effect_value.trim() : '',
            range_type: row.range_type ? row.range_type.trim() : '',
            range_detail: row.range_detail ? row.range_detail.trim() : '',
            sort_order: row.sort_order || null
          };
        }
      }
    });

    // ⭐️ [최종 정제] 프론트엔드가 부드럽게 루프를 돌 수 있도록 buffs 객체를 배열(Array)로 치환하여 반환합니다.
    const finalResult = Array.from(characterMap.values()).map(char => {
      return {
        ...char,
        buffs: Object.values(char.buffs)
      };
    });

    res.json(finalResult);
  } catch (error) {
    console.error('🚨 [DB 에러 발생]:', error.message);
    res.status(500).json({ error: '데이터베이스 조회 중 에러가 발생했습니다.' });
  }
});

// 🎯 전체 영웅 보관함 풀 조회 API (DeckBuildView.vue 우측 패널용)
app.get('/api/chars/all-pool', async (req, res) => {
  try {
    // 💡 버프/이펙트 분석 조인을 모두 제거하고 보관함 카드 렌더링에 꼭 필요한 데이터만 가볍게 조회
    const query = `
      SELECT 
        master_id, 
        char_id AS id, 
        nickname AS name, 
        grade_name AS grade,
        is_awk_yn
      FROM skia_char
      ORDER BY grade_name DESC, char_name ASC
    `;
    const result = await pool.query(query);

    const characterList = result.rows.map(row => {
      const rawId = row.id || '';
      const charKey = rawId.toUpperCase();

      // 프론트엔드 등급 탭 매칭용 포맷팅 규격 유지
      let mappedGrade = row.grade; 
      if (row.grade === '하이로드' || row.grade === 'HIGH_LOAD') mappedGrade = 'HIGH_LOAD'; 
      else if (row.grade === '레전드+' || row.grade === 'LEGEND+') mappedGrade = 'LEGEND+';
      else if (row.grade === '레전드' || row.grade === 'LEGEND') mappedGrade = 'LEGEND';      

      // 💡 무겁던 내부 buffs 객체 루프를 모두 제거하고 배치 및 카드 생성용 스켈레톤 기본 규격만 리턴
      return {
        master_id: row.master_id,
        id: rawId,
        // ⭐️ [해결] 프론트엔드 드래그앤드롭 시 개별 객체 식별 및 렌더링 에러 방지를 위한 instanceId 추가
        instanceId: String(row.master_id), 
        // ⭐️ SQL 결과 매핑(row.name은 nickname 항목임) 안정성 확보를 위해 원본 필드 대체 명시
        name: row.name || '무명', 
        grade: mappedGrade,
        is_awk_yn: row.is_awk_yn,
        color: getRandomColorById(charKey),
        // 드래그앤드롭 배치 시 에러 방지용 기본 객체 유지
        skills: { "일반공격": 35, "치명타공격": 35, "액티브공격": 40 },
        // ⭐️ [해결] batch API와 일관성을 맞추기 위해 buffs를 빈 배열로 규격 통일
        buffs: [] 
      };
    });

    res.json(characterList);
  } catch (error) {
    console.error('영웅 보관함 풀 조회 에러:', error);
    res.status(500).json({ error: '전체 영웅 데이터를 불러오는 중 에러가 발생했습니다.' });
  }
});

// 🎯 버프리스트 전용 영웅 풀 조회
app.get('/api/chars/buff-pool', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.effect_code,
        x.code_name AS effect_code_name,
        x.code_name_short effect_code_name_short,
        y.effect_type,
        e.rank_score,
        c.master_id, 
        c.char_id as id, 
        c.nickname as name, 
        c.is_awk_yn,
        COALESCE(b.effect_value::text, '') || COALESCE(b.value_unit, '') AS effect_value
      FROM skia_char_effect e
      INNER JOIN skia_char c ON e.char_id = c.char_id
      LEFT JOIN skia_char_buff b ON c.master_id = b.master_id AND e.effect_code = b.effect_code
      LEFT JOIN skia_code x ON e.effect_code = x.code_id
      LEFT JOIN skia_group_code y ON y.code_group  = x.code_group
      ORDER BY x.sort_order, e.rank_score
    `;
    const result = await pool.query(query);

    // 💡 중요도 순서가 섞이지 않게 Array(배열) 구조로 순서를 고정하여 응답을 만듭니다.
    const orderedGroups = [];
    const groupMap = new Map();

    result.rows.forEach(row => {
      const effectName = row.effect_code_name ? row.effect_code_name.trim() : '미분류 효과';
      const effectNameShort = row.effect_code_name_short ? row.effect_code_name_short.trim() : '미분류 효과';
      
      // 1. 버프 그룹 생성 (DB의 ORDER BY 순서대로 순차 등록되어 순서 보장됨)
      if (!groupMap.has(effectName)) {
        const groupObj = {
          effectName: effectName,
          effectNameShort: effectNameShort,
          effectType: row.effect_type,
          effectCode: row.effect_code,
          rankScore: row.rank_score,
          heroes: []
        };
        groupMap.set(effectName, groupObj);
        orderedGroups.push(groupObj);
      }

      const currentGroup = groupMap.get(effectName);
      const rawId = row.id || '';
      if (!rawId) return;

      // 2. 그룹 내부 영웅 중복 방지 및 최소한의 데이터 바인딩
      if (!currentGroup.heroes.some(h => h.id.toUpperCase() === rawId.toUpperCase())) {
        currentGroup.heroes.push({
          master_id: row.master_id,
          id: rawId,
          name: row.name || '무명',
          is_awk_yn: row.is_awk_yn,
          effect_value: row.effect_value || ''
        });
      }
    });

    res.json(orderedGroups);
  } catch (error) {
    console.error('버프리스트 전용 풀 조회 에러:', error);
    res.status(500).json({ error: '버프 데이터를 불러오는 중 에러가 발생했습니다.' });
  }
});

// 💡 [추가] 특정 카테고리(예: nightmare, 일반결투장 등)에 해당하는 덱 목록만 필터링하여 조회
// 💡 특정 카테고리(예: nightmare, 일반결투장 등)에 해당하는 덱 목록만 필터링하여 조회
app.get('/api/decks/category/:categoryName', async (req, res) => {
  const { categoryName } = req.params;
  
  // 단일 문자열 또는 문자열 배열로 카테고리 매핑
  let targetCategories = [categoryName];

  if (categoryName === 'nightmare') {
    // 🎯 깊은밤의악몽 + 악몽스테이지 두 개를 함께 조회
    targetCategories = ['깊은밤의악몽', '악몽스테이지','혼돈','신규영웅']; 
  } else if (categoryName === 'descent') {
    targetCategories = ['강림의날']; 
  } else if (categoryName === 'celestial') {
    targetCategories = ['천상결투장']; 
  }

  try {
    // 🎯 Postgres ANY($1) 문법을 활용하여 배열에 속한 카테고리 모두 조회
    const result = await pool.query(
      `SELECT * FROM skia_deck_share_board 
       WHERE category = ANY($1::text[]) 
       ORDER BY log_date DESC, board_id DESC`,
      [targetCategories]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리별 덱 조회 중 오류가 발생했습니다.' });
  }
});

// 🎯 캐릭터 식별자(char_id)를 Key로 하는 이미지 경로 맵 반환 API
app.get('/api/characters/images-map', async (req, res) => {
  try {
    // 테이블에서 char_id와 이미지 경로를 조회합니다.
    const result = await pool.query('SELECT char_id, char_image_url FROM skia_char');
    
    const imageMap = {};
    result.rows.forEach(row => {
      if (row.char_id) {
        // 공백 제거 및 대문자 통일로 매칭 오류를 사전 예방합니다.
        const cleanId = row.char_id.trim().toUpperCase();
        // DB 컬럼에 값이 지정되어 있다면 쓰고, 비어있다면 ID 기반의 기본 파일명을 매핑합니다.
        imageMap[cleanId] = row.char_image_url || `/uploads/chars/${row.char_id.trim()}.jpg`;
      }
    });
    
    res.json(imageMap);
  } catch (err) {
    console.error('캐릭터 이미지 맵 조회 에러:', err);
    res.status(500).json({ error: '캐릭터 이미지 데이터를 불러오지 못했습니다.' });
  }
});

function getRandomColorById(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#d35400'];
  return colors[Math.abs(hash) % colors.length];
}

// [기존] 공통코드 조회 (GET)
app.get('/api/common/codes', async (req, res) => {
  try {
    const query = `SELECT code_id, code_name, code_group, sort_order, code_name_short FROM skia_code ORDER BY code_group ASC, sort_order ASC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '공통코드 조회 실패' });
  }
});

// [신규 추가] 공통코드 등록 (POST)
app.post('/api/common/codes', async (req, res) => {
  try {
    const { code_group, code_id, code_name, code_name_short, sort_order } = req.body;

    const query = `
      INSERT INTO skia_code (code_group, code_id, code_name, code_name_short, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [code_group, code_id, code_name, code_name_short, sort_order || 0];
    
    const result = await pool.query(query, values);

    // 성공 응답 (프론트엔드 조건인 success: true 와 등록 데이터 반환)
    res.status(201).json({
      success: true,
      message: '공통코드가 등록되었습니다.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('공통코드 저장 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: 'DB 저장 중 오류가 발생했습니다.' 
    });
  }
});

// [신규 추가] 공통코드 수정 (PUT)
app.put('/api/common/codes/:code_id', async (req, res) => {
  try {
    const { code_id } = req.params;
    const { code_group, code_name, code_name_short, sort_order } = req.body;

    const query = `
      UPDATE skia_code
      SET code_group = $1,
          code_name = $2,
          code_name_short = $3,
          sort_order = $4
      WHERE code_id = $5
      RETURNING *
    `;
    const values = [code_group, code_name, code_name_short, sort_order || 0, code_id];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: '수정할 대상을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '공통코드가 수정되었습니다.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('공통코드 수정 에러:', error);
    res.status(500).json({ success: false, message: 'DB 수정 중 오류가 발생했습니다.' });
  }
});

// [신규 추가] 공통코드 삭제 (DELETE)
app.delete('/api/common/codes/:code_id', async (req, res) => {
  try {
    const { code_id } = req.params;

    const query = `DELETE FROM skia_code WHERE code_id = $1 RETURNING *`;
    const result = await pool.query(query, [code_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: '삭제할 대상을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '공통코드가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('공통코드 삭제 에러:', error);
    res.status(500).json({ success: false, message: 'DB 삭제 중 오류가 발생했습니다.' });
  }
});

// 1. READ: 전체 추천 영웅 리스트 조회 (순위 높은 순/숫자 작은 순 정렬)
app.get('/api/char-effects', async (req, res) => {
  try {
    const query = `
      SELECT e.effect_seq, e.effect_code, c.code_name, e.char_id, e.rank_score 
      FROM public.skia_char_effect e
      JOIN public.skia_code c ON c.code_id = e.effect_code
      ORDER BY e.effect_code ASC, e.rank_score ASC, e.effect_seq DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching char effects:', err);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// 2. CREATE: 새로운 추천 영웅 등록
app.post('/api/char-effects', async (req, res) => {
  const { effect_code, char_id, rank_score } = req.body;

  if (!effect_code || !char_id || rank_score === undefined) {
    return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
  }

  try {
    const query = `
      INSERT INTO public.skia_char_effect (effect_code, char_id, rank_score)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [effect_code, char_id, rank_score];
    const { rows } = await pool.query(query, values);
    
    res.status(201).json({ message: '등록 성공', data: rows[0] });
  } catch (err) {
    console.error('Error inserting char effect:', err);
    res.status(500).json({ error: '데이터 저장 중 오류가 발생했습니다.' });
  }
});

// 3. UPDATE: 추천 정보 수정 (PK: effect_seq 기준)
app.put('/api/char-effects/:effect_seq', async (req, res) => {
  const { effect_seq } = req.params;
  const { effect_code, char_id, rank_score } = req.body;

  try {
    const query = `
      UPDATE public.skia_char_effect
      SET effect_code = $1, char_id = $2, rank_score = $3
      WHERE effect_seq = $4
      RETURNING *
    `;
    const values = [effect_code, char_id, rank_score, effect_seq];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: '수정할 해당 데이터를 찾을 수 없습니다.' });
    }

    res.json({ message: '수정 성공', data: rows[0] });
  } catch (err) {
    console.error('Error updating char effect:', err);
    res.status(500).json({ error: '데이터 수정 중 오류가 발생했습니다.' });
  }
});

// 4. DELETE: 추천 정보 삭제 (PK: effect_seq 기준)
app.delete('/api/char-effects/:effect_seq', async (req, res) => {
  const { effect_seq } = req.params;

  try {
    const query = `
      DELETE FROM public.skia_char_effect
      WHERE effect_seq = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [effect_seq]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '삭제할 해당 데이터를 찾을 수 없습니다.' });
    }

    res.json({ message: '삭제 성공', deleted: rows[0] });
  } catch (err) {
    console.error('Error deleting char effect:', err);
    res.status(500).json({ error: '데이터 삭제 중 오류가 발생했습니다.' });
  }
});

// [백엔드] Express 라우트
app.get('/api/chars/detail/:char_id', async (req, res) => {
  const { char_id } = req.params;
  try {
    // 1. 캐릭터 기본 정보 조회
    const baseResult = await pool.query(
      `SELECT master_id, 
              char_id AS id, 
              nickname AS name, 
              battle_type, 
              attack_style_code,
              code.code_name AS attack_style_name, 
              is_awk_yn, 
              char_detail 
       FROM skia_char
       LEFT JOIN skia_code code ON skia_char.attack_style_code = code.code_id 
       WHERE UPPER(char_id) = UPPER($1)`,
      [char_id]
    );

    if (baseResult.rows.length === 0) {
      return res.status(404).json({ message: '해당 캐릭터를 찾을 수 없습니다.' });
    }

    const heroBase = baseResult.rows[0];

    // 2. skia_char_buff 및 코드 테이블 조인 조회
    const buffQuery = `
      SELECT 
        b.buff_seq,
        b.skill_code,
        b.buff_name,
        b.target_code,
        tc.code_name AS target_type,              -- Vue: b.target_type 매핑
        b.target_point_code, 
        tpc.code_name AS target_point_name,
        gc.effect_type AS effect_type,           -- '버프', '디버프' 등
        b.effect_code,
        c.code_name AS effect_code_name,
        b.effect_value,                           -- 원본 수치 (계산용)
        b.value_unit AS unit,                     -- Vue: b.unit 매핑
        COALESCE(b.effect_value::text, '') AS effect_value_str,
        b.effect_duration AS duration,
        b.max_stack,                              -- 중첩 수
        b.hit_count,                              -- 타격 수
        b.skill_range AS range,                   -- 사거리 (int4)
        b.skill_cool_time AS cooldown,            -- 🔥 ERD 컬럼 반영: skill_cool_time (numeric)
        b.range_type,
        b.range_detail,
        b.range_x,
        b.range_y,
        b.buff_condition,
        b.remark
      FROM skia_char_buff b
      LEFT JOIN skia_code c ON b.effect_code = c.code_id
      LEFT JOIN skia_group_code gc ON c.code_group = gc.code_group
      LEFT JOIN skia_code tc ON b.target_code = tc.code_id
      LEFT JOIN skia_code tpc ON b.target_point_code = tpc.code_id
      WHERE b.master_id = $1
      ORDER BY b.skill_code, b.value_unit
    `;

    const buffResult = await pool.query(buffQuery, [heroBase.master_id]);

    // 3. 계산치(calculated_value) 및 프론트엔드 반환 데이터 포맷팅
    const formattedBuffs = buffResult.rows.map(b => {
      let calcVal = null;
      
      if (b.effect_value !== null && b.effect_value !== undefined) {
        const val = Number(b.effect_value);
        const hits = Number(b.hit_count) || 1;
        const stacks = Number(b.max_stack) || 1;
        const unit = b.unit || '%';

        // 1순위: DB의 max_value 컬럼에 수동 입력값이 있는 경우 (곱연산 등 예외 케이스)
        if (b.max_value !== null && b.max_value !== undefined && Number(b.max_value) > 0) {
          const maxVal = Number(b.max_value);
          
          if (stacks > 1) {
            calcVal = `${maxVal.toLocaleString()}${unit} (최대 ${stacks}중첩)`;
          } else if (hits > 1) {
            calcVal = `${maxVal.toLocaleString()}${unit} (총 ${hits}타)`;
          } else {
            calcVal = `${maxVal.toLocaleString()}${unit}`;
          }
        } 
        // 2순위: 수동 입력값은 없지만 타격수가 2 이상인 경우 (자동 단순 곱셈)
        else if (hits > 1) {
          calcVal = `${(val * hits).toLocaleString()}${unit} (총 ${hits}타)`;
        } 
        // 3순위: 수동 입력값은 없지만 중첩수가 2 이상인 경우 (자동 단순 곱셈)
        else if (stacks > 1) {
          calcVal = `${(val * stacks).toLocaleString()}${unit} (${stacks}중첩)`;
        }
      }

      return {
        ...b,
        effect_value: b.effect_value_str,
        max_value: b.max_value ? Number(b.max_value) : null,
        calculated_value: calcVal // Vue: b.calculated_value 매핑
      };
    });

    res.json({
      ...heroBase,
      buffs: formattedBuffs
    });
  } catch (err) {
    console.error('캐릭터 상세 정보 조회 에러:', err);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});
app.listen(port, () => {
  console.log(`Skia 통합 백엔드 서버가 포트 ${port} 에서 원활하게 작동 중입니다.`);
});