import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { getDb } from '../db/connection.js';
import { migrate } from '../db/migrate.js';
import { hashPassword } from '../utils/passwords.js';
import { createUser, findUserByEmail, setUserRole, toPublicUser } from '../repositories/userRepository.js';

migrate(getDb());


async function promptHidden(label) {
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('A compatible terminal is required to enter the password securely.');
  }

  output.write(label);

  let value = '';
  const wasRaw = input.isRaw;

  const onData = (chunk) => {
    const text = chunk.toString('utf8');

    if (text.includes('\u0003')) {
      cleanup();
      output.write('\n');
      process.exit(1);
    }

    for (const char of text) {
      if (char === '\r' || char === '\n') {
        cleanup();
        output.write('\n');
        resolvePassword();
        return;
      }

      if (char === '\u007f' || char === '\u0008') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    }
  };

  let resolvePassword;

  const cleanup = () => {
    input.off('data', onData);
    input.setRawMode(wasRaw ?? false);
  };

  try {
    const passwordPromise = new Promise((resolve) => {
      resolvePassword = () => resolve(value);
    });

    input.setRawMode(true);
    input.resume();
    input.on('data', onData);

    return await passwordPromise;
  } finally {
    input.off('data', onData);
    input.setRawMode(wasRaw ?? false);
  }
}

async function create() {
  const rl = readline.createInterface({ input, output });
  const name = (await rl.question('Name: ')).trim();
  const email = (await rl.question('Email: ')).trim();
  rl.close();
  const password = await promptHidden('Password (hidden): ');
  if (findUserByEmail(email)) {
    console.error('An account with that email already exists. Use promote instead.');
    process.exit(1);
  }
  const user = createUser({ name, email, passwordHash: await hashPassword(password), role: 'admin' });
  console.log('Created admin:', toPublicUser(user));
}

function changeRole(email, role) {
  const user = findUserByEmail(email);
  if (!user) {
    console.error('No user with that email.');
    process.exit(1);
  }
  console.log('Updated:', toPublicUser(setUserRole(user.id, role)));
}

const [, , command, emailArg] = process.argv;
if (command === 'create') await create();
else if (command === 'promote') changeRole(emailArg, 'admin');
else if (command === 'demote') changeRole(emailArg, 'user');
else {
  console.log('Usage: npm run admin:create | admin:promote -- email | admin:demote -- email');
  process.exit(1);
}
