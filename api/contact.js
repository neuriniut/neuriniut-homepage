// 참여공간 문의 폼 -> 네이버 SMTP로 이메일 전송
// Vercel Serverless Function (파일 위치: /api/contact.js)
const nodemailer = require('nodemailer');

function esc(str) {
  return String(str || '').replace(/[<>]/g, '');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    return;
  }

  try {
    const body = req.body || {};
    const name = esc(body.name).trim();
    const phone = esc(body.phone).trim();
    const email = esc(body.email).trim();
    const type = esc(body.type).trim();
    const message = esc(body.message).trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: '이름, 이메일, 문의 내용을 모두 입력해 주세요.' });
      return;
    }
    if (message.length > 5000) {
      res.status(400).json({ error: '문의 내용이 너무 깁니다.' });
      return;
    }

    const user = process.env.NAVER_SMTP_USER;
    const pass = process.env.NAVER_SMTP_PASS;
    if (!user || !pass) {
      console.error('contact form: NAVER_SMTP_USER / NAVER_SMTP_PASS 환경변수가 설정되지 않았습니다.');
      res.status(500).json({ error: '메일 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.naver.com',
      port: 587,
      secure: false, // 587 포트는 STARTTLS 사용
      requireTLS: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"느린이웃 홈페이지" <${user}>`,
      to: 'slowfamily@naver.com',
      replyTo: email,
      subject: `[느린이웃 홈페이지 문의] ${type || '문의'} - ${name}`,
      text:
        `이름: ${name}\n` +
        `연락처: ${phone || '(입력 안 함)'}\n` +
        `이메일: ${email}\n` +
        `문의 유형: ${type || '(선택 안 함)'}\n\n` +
        `문의 내용:\n${message}`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form send error:', err);
    res.status(500).json({ error: '메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
  }
};
