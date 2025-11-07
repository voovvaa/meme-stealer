#!/bin/bash

# Fix Config Repository  
sed -i 's/this\.updateConfigStmt\.run(/this.updateConfigStmt.run([/g' src/repositories/config.repository.ts
sed -i 's/this\.insertConfigStmt\.run(/this.insertConfigStmt.run([/g' src/repositories/config.repository.ts
sed -i 's/^ *now$/        now,/g' src/repositories/config.repository.ts
sed -i 's/      );$/      ]);/g' src/repositories/config.repository.ts

# Fix Channel Repository
sed -i 's/this\.insertStmt\.run(/this.insertStmt.run([/g' src/repositories/channel.repository.ts
sed -i 's/this\.updateStmt\.run(/this.updateStmt.run([/g' src/repositories/channel.repository.ts
sed -i 's/this\.archiveStmt\.run(/this.archiveStmt.run([/g' src/repositories/channel.repository.ts
sed -i 's/this\.unarchiveStmt\.run(/this.unarchiveStmt.run([/g' src/repositories/channel.repository.ts
sed -i 's/this\.deleteStmt\.run(/this.deleteStmt.run([/g' src/repositories/channel.repository.ts

# Fix Keyword Repository  
sed -i 's/this\.insertStmt\.run(/this.insertStmt.run([/g' src/repositories/keyword.repository.ts
sed -i 's/this\.updateStmt\.run(/this.updateStmt.run([/g' src/repositories/keyword.repository.ts
sed -i 's/this\.archiveStmt\.run(/this.archiveStmt.run([/g' src/repositories/keyword.repository.ts
sed -i 's/this\.unarchiveStmt\.run(/this.unarchiveStmt.run([/g' src/repositories/keyword.repository.ts
sed -i 's/this\.deleteStmt\.run(/this.deleteStmt.run([/g' src/repositories/keyword.repository.ts

# Fix Meme Repository
sed -i 's/this\.insertStmt\.run(/this.insertStmt.run([/g' src/repositories/meme.repository.ts

# Replace all patterns
for file in src/repositories/*.ts; do
  # Close function call arrays
  sed -i ':a;N;$!ba;s/\.run(\[\n *\([^)]*\)\n *);/.run([\1]);/g' "$file"
  sed -i ':a;N;$!ba;s/\.all(\[\n *\([^)]*\)\n *);/.all([\1]);/g' "$file"
  # Fix remaining multiline issues
  sed -i 's/      );$/      ]);/g' "$file"
  sed -i 's/    );$/    ]);/g' "$file"
done

echo "Fixed!"
