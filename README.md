# TrASH - Trump Automated Search Hub

## Απαιτήσεις
1. Python 3.7+
2. Npm & Node
3. Elasticsearch 7.17.x

## Οδηγία
Ανοίξτε 3 διαφορετικά τερματικά για να τρέξετε την εφαρμογή

## Εγκατάσταση
### 1. Εγκατάσταση & Εκκίνηση Elasticsearch

**Windows:**
```bash
# Κατέβασμα από: https://www.elastic.co/downloads/past-releases/elasticsearch-7-17-27
# Αποσυμπίεση και εκτέλεση:
cd C:\path\to\elasticsearch-7.17.x
bin\elasticsearch.bat
```

**Linux/Mac:**
```bash
# Κατέβασμα από: https://www.elastic.co/downloads/past-releases/elasticsearch-7-17-27 ή κάποιο install command
tar -xzf elasticsearch-7.17.x.tar.gz
cd /path/to/elasticsearch-7.17.x
./bin/elasticsearch
```

### 2. Εγκατάσταση Python dependencies (pip3,python3 για Linux/Mac αν δεν δουλέψει το παρακάτω)
```bash
pip install -r requirements.txt
python app.py
```

### 3. Frontend(React + CSS)
```bash
npm install
npm run dev
```

## Εκτέλεση
Θα ανοίξετε τα 3 τερματικά θα τρέξετε τις εντολές που γράφονται πιο πάνω.(βεβαιωθείτε ότι αφήσατε λίγο χρόνο για το Elasticsearch να συνδεθεί)
Κατά την πρώτη εκτέλεση, η βάση είναι κενή
Πατήστε το εικονίδιο των Ρυθμίσεων πάνω δεξιά -> πατήστε το κουμπί της εισαγωγής από CSV -> μετά θα γίνει η ενημέρωση των στατιστικών αυτόματα και μπορούμε να εκτελέσουμε τις
λειτουργίες της εκφώνησης της άσκησης

## Επιπλέον λειτουργίες που υλοποιήθηκαν
1. Είναι μία web εφαρμογή με python στο backend με Elasticsearch και React.js στο frontend
2. Αντί να χρησιμοποιούνται τα σύμβολα +/|/- βελτιώσαμε αυτή την δύστροπη σύνταξη σε AND/OR/NOT 
3. Χρησιμοποιήσαμε MD5 hashing(Content + Date) για την δημιουργία μοναδικών αναγνωριστικών, οπότε όσες φορές και να κάνουμε import δεν γεμίζουμε με διπλότυπα
4. Προσθέσαμε ένα Dashboard με πραγματικά στατιστικά (Aggregations) που δείχνει κατανομές (Total Reactions, Post Types, Averages) σε πραγματικό χρόνο.
